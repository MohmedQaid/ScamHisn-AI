import net from 'node:net';
import { parse as parseDomain } from 'tldts';
import type { DomainRegistration } from '@scamhisn/shared';

// Fast-path RDAP base endpoints for common TLDs
const KNOWN_RDAP_SERVERS: Record<string, string> = {
  com: 'https://rdap.verisign.com/com/v1/',
  net: 'https://rdap.verisign.com/net/v1/',
  org: 'https://rdap.publicinterestregistry.org/rdap/',
  info: 'https://rdap.identitydigital.services/rdap/',
  biz: 'https://rdap.nic.biz/',
  io: 'https://rdap.identitydigital.services/rdap/',
  ai: 'https://rdap.identitydigital.services/rdap/',
  co: 'https://rdap.registry.co/rdap/',
  app: 'https://pubapi.registry.google/rdap/',
  dev: 'https://pubapi.registry.google/rdap/',
  page: 'https://pubapi.registry.google/rdap/',
  xyz: 'https://rdap.centralnic.com/xyz/',
  top: 'https://rdap.zdnsgtld.com/top/',
  shop: 'https://rdap.gmoregistry.net/rdap/',
  online: 'https://rdap.centralnic.com/online/',
  site: 'https://rdap.centralnic.com/site/',
  me: 'https://rdap.identitydigital.services/rdap/',
  uk: 'https://rdap.nominet.uk/uk/',
  ca: 'https://rdap.ca.fury.ca/rdap/',
  au: 'https://rdap.auda.org.au/',
  de: 'https://rdap.denic.de/',
  fr: 'https://rdap.nic.fr/',
  nl: 'https://rdap.sidn.nl/',
  in: 'https://rdap.nixiregistry.in/rdap/',
};

// Direct WHOIS fallback servers for TLDs without public RDAP
const KNOWN_WHOIS_SERVERS: Record<string, string> = {
  ae: 'whois.aeda.net.ae',
  sa: 'whois.nic.net.sa',
  qa: 'whois.registry.qa',
  bh: 'whois.nic.bh',
  om: 'whois.registry.om',
  kw: 'whois.nic.kw',
  eg: 'whois.ripe.net',
  ru: 'whois.tcinet.ru',
  cn: 'whois.cnnic.cn',
  jp: 'whois.jprs.jp',
  sg: 'whois.sgnic.sg',
};

let ianaBootstrapCache: { fetchedAt: number; tldMap: Map<string, string> } | null = null;
const BOOTSTRAP_TTL_MS = 24 * 60 * 60 * 1000;

async function getRdapServerForTld(tld: string): Promise<string | null> {
  const lower = tld.toLowerCase();
  if (KNOWN_RDAP_SERVERS[lower]) {
    return KNOWN_RDAP_SERVERS[lower]!;
  }

  const now = Date.now();
  if (!ianaBootstrapCache || now - ianaBootstrapCache.fetchedAt > BOOTSTRAP_TTL_MS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('https://data.iana.org/rdap/dns.json', {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = (await res.json()) as { services?: Array<[string[], string[]]> };
        const tldMap = new Map<string, string>();
        for (const [tlds, urls] of data.services ?? []) {
          const base = urls.find((u) => u.startsWith('https://')) ?? urls[0];
          if (!base) continue;
          for (const t of tlds) {
            tldMap.set(t.toLowerCase(), base.endsWith('/') ? base : `${base}/`);
          }
        }
        ianaBootstrapCache = { fetchedAt: now, tldMap };
      }
    } catch {
      // Fall back gracefully
    }
  }

  return ianaBootstrapCache?.tldMap.get(lower) ?? null;
}

interface RdapEvent {
  eventAction?: string;
  eventDate?: string;
}

interface RdapEntity {
  roles?: string[];
  vcardArray?: [string, Array<[string, Record<string, unknown>, string, unknown]>];
}

interface RdapResponse {
  events?: RdapEvent[];
  entities?: RdapEntity[];
  status?: string[];
}

function extractRegistrarFromRdap(entities: RdapEntity[] | undefined): string | null {
  if (!entities) return null;
  for (const entity of entities) {
    if (!entity.roles?.includes('registrar')) continue;
    const vcardRows = entity.vcardArray?.[1];
    if (!Array.isArray(vcardRows)) continue;
    for (const row of vcardRows) {
      if (row[0] === 'fn' && typeof row[3] === 'string' && row[3].trim()) {
        return row[3].trim();
      }
    }
  }
  return null;
}

async function queryRdap(domain: string, tld: string): Promise<DomainRegistration | null> {
  const base = await getRdapServerForTld(tld);
  const endpoints = base
    ? [`${base}domain/${encodeURIComponent(domain)}`]
    : [`https://rdap.org/domain/${encodeURIComponent(domain)}`];

  for (const url of endpoints) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/rdap+json, application/json' },
        redirect: 'follow',
      });
      clearTimeout(timer);
      if (!res.ok) continue;

      const data = (await res.json()) as RdapResponse;
      const regEvent = data.events?.find(
        (e) => e.eventAction === 'registration' || e.eventAction === 'registered',
      );
      const expEvent = data.events?.find((e) => e.eventAction === 'expiration');

      const createdAt = parseIsoDate(regEvent?.eventDate);
      const expiresAt = parseIsoDate(expEvent?.eventDate);
      const registrar = extractRegistrarFromRdap(data.entities);
      const statuses = (data.status ?? []).slice(0, 10);

      if (!createdAt && !registrar && statuses.length === 0) {
        continue;
      }

      return buildRegistrationResult(domain, 'rdap', createdAt, expiresAt, registrar, statuses, null);
    } catch {
      clearTimeout(timer);
    }
  }
  return null;
}

function rawWhoisQuery(server: string, query: string, timeoutMs = 4000): Promise<string> {
  return new Promise((resolve, reject) => {
    // Only allow safe domain hostnames for WHOIS servers
    if (!/^[a-z0-9.-]+$/i.test(server) || server.includes('..')) {
      reject(new Error('Invalid WHOIS server hostname'));
      return;
    }

    const socket = net.createConnection({ host: server, port: 43, timeout: timeoutMs });
    let data = '';
    const MAX_BYTES = 64 * 1024;

    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('WHOIS timeout'));
    }, timeoutMs);

    socket.on('connect', () => {
      socket.write(`${query}\r\n`);
    });

    socket.on('data', (chunk) => {
      if (data.length < MAX_BYTES) {
        data += chunk.toString('utf8');
      }
    });

    socket.on('end', () => {
      clearTimeout(timer);
      resolve(data);
    });

    socket.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

async function queryWhoisFallback(domain: string, tld: string): Promise<DomainRegistration | null> {
  try {
    let server = KNOWN_WHOIS_SERVERS[tld.toLowerCase()];
    if (!server) {
      const ianaRaw = await rawWhoisQuery('whois.iana.org', domain, 3500);
      const referMatch = /^refer:\s*([a-z0-9.-]+)\s*$/im.exec(ianaRaw);
      if (referMatch?.[1]) {
        server = referMatch[1].trim();
      }
    }
    if (!server) return null;

    const raw = await rawWhoisQuery(server, domain, 4000);
    if (!raw || raw.length < 20) return null;

    const createdMatch =
      /(?:Creation Date|Created On|Created|Registered On|Registration Date|Domain Registration Date)\s*:\s*([^\r\n]+)/i.exec(
        raw,
      );
    const expiresMatch =
      /(?:Registry Expiry Date|Expiration Date|Expiry Date|Paid-till|Expires On)\s*:\s*([^\r\n]+)/i.exec(
        raw,
      );
    const registrarMatch = /(?:Registrar Name|Registrar)\s*:\s*([^\r\n]+)/i.exec(raw);

    const statusMatches = Array.from(raw.matchAll(/(?:Domain Status|Status)\s*:\s*([^\r\n]+)/gi))
      .map((m) => m[1]?.trim().split(/\s+/)[0] ?? '')
      .filter(Boolean)
      .slice(0, 8);

    const createdAt = parseIsoDate(createdMatch?.[1]);
    const expiresAt = parseIsoDate(expiresMatch?.[1]);
    const registrar = registrarMatch?.[1]?.trim() || null;

    if (!createdAt && !registrar && statusMatches.length === 0) {
      return null;
    }

    return buildRegistrationResult(
      domain,
      'whois',
      createdAt,
      expiresAt,
      registrar,
      Array.from(new Set(statusMatches)),
      null,
    );
  } catch {
    return null;
  }
}

function parseIsoDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/\s+\(.*\)$/, '');
  const d = new Date(cleaned);
  if (Number.isNaN(d.getTime())) return null;
  // Sanity bounds: 1985 to 2100
  const year = d.getUTCFullYear();
  if (year < 1985 || year > 2100) return null;
  return d.toISOString();
}

function buildRegistrationResult(
  registrableDomain: string | null,
  source: DomainRegistration['source'],
  createdAt: string | null,
  expiresAt: string | null,
  registrar: string | null,
  statuses: string[],
  error: string | null,
): DomainRegistration {
  let domainAgeDays: number | null = null;
  if (createdAt) {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    domainAgeDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  return {
    registrableDomain,
    source,
    createdAt,
    expiresAt,
    registrar,
    domainAgeDays,
    isNewlyRegistered: domainAgeDays !== null && domainAgeDays < 30,
    isYoungDomain: domainAgeDays !== null && domainAgeDays >= 30 && domainAgeDays < 90,
    statuses,
    error,
  };
}

/**
 * Retrieves domain registration age, creation date, and registrar using free public RDAP
 * with a lightweight raw TCP WHOIS fallback for TLDs without RDAP endpoints.
 */
export async function inspectDomainRegistration(hostname: string): Promise<DomainRegistration> {
  const parsed = parseDomain(hostname);
  const registrableDomain = parsed.domain ?? null;

  if (!registrableDomain || parsed.isIp) {
    return buildRegistrationResult(
      null,
      'unavailable',
      null,
      null,
      null,
      [],
      parsed.isIp ? 'Raw IP address has no domain registration' : 'Could not determine registrable domain',
    );
  }

  const parts = registrableDomain.split('.');
  const tld = parts[parts.length - 1] ?? '';

  const rdap = await queryRdap(registrableDomain, tld);
  if (rdap) return rdap;

  const whois = await queryWhoisFallback(registrableDomain, tld);
  if (whois) return whois;

  return buildRegistrationResult(
    registrableDomain,
    'unavailable',
    null,
    null,
    null,
    [],
    'Public RDAP and WHOIS records were unavailable for this domain',
  );
}
