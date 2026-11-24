import dns from 'node:dns/promises';
import ipaddr from 'ipaddr.js';

export class SsrfError extends Error {
  public readonly code: string;
  public readonly messageAr: string;
  public readonly statusCode: number;

  constructor(code: string, message: string, messageAr: string, statusCode = 400) {
    super(message);
    this.name = 'SsrfError';
    this.code = code;
    this.messageAr = messageAr;
    this.statusCode = statusCode;
  }
}

export interface SafeUrlResult {
  url: URL;
  normalizedUrl: string;
  hostname: string;
  resolvedIps: string[];
}

export type DnsLookupFn = (hostname: string) => Promise<string[]>;

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  'metadata.google.internal',
  'metadata',
  'instance-data',
]);

const BLOCKED_HOST_SUFFIXES = [
  '.localhost',
  '.local',
  '.internal',
  '.home.arpa',
  '.intranet',
  '.lan',
];

/**
 * Normalizes a user-supplied URL string. Prepends https:// only if no scheme is present.
 * Never permits non-HTTP(S) schemes like file:, javascript:, data:, ftp:, gopher:.
 */
export function normalizeUserUrl(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new SsrfError(
      'INVALID_URL',
      'Please enter a valid URL to inspect.',
      'لو سمحت ادخل رابط صحيح عشان نفحصه.',
    );
  }

  // Reject whitespace or control characters inside URL
  if (/[\s\x00-\x1f\x7f]/.test(trimmed)) {
    throw new SsrfError(
      'INVALID_URL',
      'URL contains invalid whitespace or control characters.',
      'الرابط فيه مسافات أو رموز غير صالحة.',
    );
  }

  // Check if a scheme is already specified
  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(trimmed);
  if (schemeMatch) {
    const scheme = schemeMatch[1]?.toLowerCase();
    if (scheme !== 'http' && scheme !== 'https') {
      throw new SsrfError(
        'UNSUPPORTED_SCHEME',
        `Unsupported URL protocol "${scheme}:". Only http:// and https:// URLs are allowed.`,
        `البروتوكول "${scheme}:" غير مدعوم. نفحص بس روابط http:// و https://.`,
      );
    }
    return trimmed;
  }

  // Reject scheme-relative URLs like //127.0.0.1
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  return `https://${trimmed}`;
}

/**
 * Strictly validates that an IPv4 or IPv6 address is publicly routable (unicast only).
 * Automatically unwraps IPv4-mapped IPv6 addresses (e.g. ::ffff:127.0.0.1).
 */
export function isPublicIp(rawIp: string): boolean {
  const ip = rawIp.replace(/^\[|\]$/g, '').split('%')[0]?.trim() ?? '';
  if (!ip || !ipaddr.isValid(ip)) {
    return false;
  }

  let parsed = ipaddr.parse(ip);

  if (parsed.kind() === 'ipv6') {
    const v6 = parsed as ipaddr.IPv6;
    if (v6.isIPv4MappedAddress()) {
      parsed = v6.toIPv4Address();
    } else {
      const range = v6.range();
      if (range !== 'unicast') {
        return false;
      }
      // Explicitly block fc00::/7 (uniqueLocal), fe80::/10 (linkLocal), ::1, ::
      const firstPart = v6.parts[0] ?? 0;
      if ((firstPart & 0xfe00) === 0xfc00) return false; // fc00::/7
      if ((firstPart & 0xffc0) === 0xfe80) return false; // fe80::/10
      return true;
    }
  }

  const v4 = parsed as ipaddr.IPv4;
  const range = v4.range();
  if (range !== 'unicast') {
    return false;
  }

  // Extra explicit defense-in-depth checks for common cloud metadata / private ranges
  const [a, b] = v4.octets;
  if (a === 0 || a === 10 || a === 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b !== undefined && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 100 && b !== undefined && b >= 64 && b <= 127) return false; // CGNAT 100.64.0.0/10
  if (a !== undefined && a >= 224) return false; // Multicast & reserved

  return true;
}

async function defaultDnsLookup(hostname: string): Promise<string[]> {
  const results = await dns.lookup(hostname, { all: true, verbatim: true });
  return results.map((entry) => entry.address);
}

/**
 * Validates URL syntax, scheme, hostname safety, and post-DNS public IP routing.
 * Blocks SSRF targeting loopback, private networks, link-local / cloud metadata, and IPv6 ULA.
 */
export async function assertSafeUrl(
  rawUrl: string,
  lookupFn: DnsLookupFn = defaultDnsLookup,
): Promise<SafeUrlResult> {
  const normalized = normalizeUserUrl(rawUrl);

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new SsrfError(
      'INVALID_URL',
      'Malformed URL syntax. Please provide a valid http:// or https:// address.',
      'صيغة الرابط غير صحيحة. تأكد من كتابة رابط صحيح يبدأ بـ https://.',
    );
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new SsrfError(
      'UNSUPPORTED_SCHEME',
      `Protocol "${parsed.protocol}" is blocked. Only HTTP and HTTPS are allowed.`,
      `البروتوكول "${parsed.protocol}" محظور. يُسمح فقط بروابط HTTP و HTTPS.`,
    );
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  const cleanHost = hostname.replace(/^\[|\]$/g, '');

  if (!cleanHost) {
    throw new SsrfError(
      'INVALID_URL',
      'URL is missing a valid hostname.',
      'الرابط ما فيه اسم نطاق صالح.',
    );
  }

  if (
    BLOCKED_HOSTNAMES.has(cleanHost) ||
    BLOCKED_HOST_SUFFIXES.some((suffix) => cleanHost.endsWith(suffix))
  ) {
    throw new SsrfError(
      'SSRF_BLOCKED',
      `Access to internal or local hostname "${cleanHost}" is blocked for security.`,
      `ممنوع فحص النطاقات الداخلية أو المحلية ("${cleanHost}") لأسباب أمنية.`,
      403,
    );
  }

  // If hostname is an IP literal (Node URL parser already canonicalizes hex/octal/decimal IPs)
  if (ipaddr.isValid(cleanHost)) {
    if (!isPublicIp(cleanHost)) {
      throw new SsrfError(
        'SSRF_BLOCKED',
        `Access to private, loopback, or link-local IP "${cleanHost}" is blocked.`,
        `تم حظر الوصول لعنوان IP خاص أو محلي ("${cleanHost}") حمايةً من هجمات SSRF.`,
        403,
      );
    }
    return {
      url: parsed,
      normalizedUrl: parsed.toString(),
      hostname: cleanHost,
      resolvedIps: [cleanHost],
    };
  }

  // Must contain a dot for public DNS hostname
  if (!cleanHost.includes('.')) {
    throw new SsrfError(
      'INVALID_HOSTNAME',
      `Hostname "${cleanHost}" is not a valid public domain.`,
      `اسم النطاق "${cleanHost}" غير صالح كنطاق عام على الإنترنت.`,
    );
  }

  let resolvedIps: string[];
  try {
    resolvedIps = await lookupFn(cleanHost);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code ?? 'DNS_ERROR';
    throw new SsrfError(
      'DNS_RESOLUTION_FAILED',
      `Could not resolve domain "${cleanHost}" (${code}). The domain may not exist or is unreachable.`,
      `ما قدرنا نوصل للنطاق "${cleanHost}" (${code}). ممكن النطاق غير موجود أو متوقف.`,
      422,
    );
  }

  if (!resolvedIps || resolvedIps.length === 0) {
    throw new SsrfError(
      'DNS_RESOLUTION_FAILED',
      `Domain "${cleanHost}" returned no DNS A/AAAA records.`,
      `النطاق "${cleanHost}" ما عنده سجلات DNS صالحة.`,
      422,
    );
  }

  for (const ip of resolvedIps) {
    if (!isPublicIp(ip)) {
      throw new SsrfError(
        'SSRF_BLOCKED',
        `Domain "${cleanHost}" resolves to a blocked internal/private IP address (${ip}).`,
        `النطاق "${cleanHost}" يوجّه لعنوان داخلي أو محلي محظور (${ip}).`,
        403,
      );
    }
  }

  return {
    url: parsed,
    normalizedUrl: parsed.toString(),
    hostname: cleanHost,
    resolvedIps: Array.from(new Set(resolvedIps)),
  };
}
