export interface BrandEntry {
  name: string;
  tokens: string[];
  officialDomains: string[];
  isUaeEntity?: boolean;
  /**
   * Short brand words (e.g. "tamm", "fab", "du") that are too ambiguous for substring matching.
   * They only count when they appear as a whole hyphen/dot-separated label of the host AND
   * another label is a scam-context word (login, pay, fines, verify ...).
   */
  keywords?: string[];
}

export const PROTECTED_BRANDS: BrandEntry[] = [
  // UAE Government & Sovereign Entities
  {
    name: 'UAE PASS',
    tokens: ['uaepass', 'uae-pass'],
    officialDomains: ['uaepass.ae', 'selfcare.uaepass.ae'],
    isUaeEntity: true,
  },
  {
    name: 'UAE Government (u.ae)',
    tokens: ['uaegov', 'government-ae'],
    officialDomains: ['u.ae', 'gov.ae'],
    isUaeEntity: true,
  },
  {
    name: 'TAMM Abu Dhabi',
    tokens: ['tamm-abudhabi', 'tamm-uae', 'tamm-gov', 'tammabudhabi'],
    keywords: ['tamm'],
    officialDomains: ['tamm.abudhabi'],
    isUaeEntity: true,
  },
  {
    name: 'ICP UAE (Federal Authority for Identity & Citizenship)',
    tokens: ['icp-uae', 'smartservices-icp', 'ica-gov'],
    keywords: ['icp'],
    officialDomains: ['icp.gov.ae', 'ica.gov.ae'],
    isUaeEntity: true,
  },
  {
    name: 'Emirates ID (ICP)',
    tokens: ['emiratesid', 'emirates-id'],
    officialDomains: ['icp.gov.ae'],
    isUaeEntity: true,
  },
  {
    name: 'Ministry of Interior UAE (MOI)',
    tokens: ['moi-uae', 'moi-gov'],
    keywords: ['moi'],
    officialDomains: ['moi.gov.ae'],
    isUaeEntity: true,
  },
  {
    name: 'Dubai Police',
    tokens: ['dubaipolice', 'dubai-police'],
    officialDomains: ['dubaipolice.gov.ae'],
    isUaeEntity: true,
  },
  {
    name: 'Abu Dhabi Police',
    tokens: ['adpolice', 'abudhabipolice', 'abudhabi-police', 'abu-dhabi-police', 'ad-police'],
    officialDomains: ['adpolice.gov.ae'],
    isUaeEntity: true,
  },
  {
    name: 'RTA Dubai',
    tokens: ['rtadubai', 'rta-dubai', 'rta-fine', 'rta-uae'],
    officialDomains: ['rta.ae'],
    isUaeEntity: true,
  },
  {
    name: 'Salik',
    tokens: ['salik'],
    officialDomains: ['salik.ae', 'salik.gov.ae'],
    isUaeEntity: true,
  },
  {
    name: 'DEWA',
    tokens: ['dewa-bill', 'dewa-pay', 'dewadubai'],
    officialDomains: ['dewa.gov.ae'],
    isUaeEntity: true,
  },
  {
    name: 'Emirates Post',
    tokens: ['emiratespost', 'emirates-post', 'epg-ae'],
    officialDomains: ['emiratespost.ae', 'epg.ae', 'epg.gov.ae'],
    isUaeEntity: true,
  },
  {
    name: 'e& (Etisalat)',
    tokens: ['etisalat', 'eand-uae'],
    officialDomains: ['etisalat.ae', 'eand.com'],
    isUaeEntity: true,
  },
  {
    name: 'du Telecom',
    tokens: ['du-telecom', 'du-uae', 'du-recharge'],
    keywords: ['du'],
    officialDomains: ['du.ae'],
    isUaeEntity: true,
  },
  {
    name: 'ADNOC',
    tokens: ['adnoc'],
    officialDomains: ['adnoc.ae', 'adnocdistribution.ae', 'adnocgas.ae'],
    isUaeEntity: true,
  },
  {
    name: 'Darb (Abu Dhabi toll gates)',
    tokens: ['darb-toll', 'darbtoll'],
    keywords: ['darb'],
    officialDomains: ['itc.gov.ae'],
    isUaeEntity: true,
  },
  {
    name: 'ADDC / AADC (TAQA Distribution)',
    tokens: ['taqadistribution', 'taqa-distribution'],
    keywords: ['addc', 'aadc'],
    officialDomains: ['addc.ae', 'aadc.ae', 'taqadistribution.ae', 'taqa.com'],
    isUaeEntity: true,
  },
  {
    name: 'MOHRE',
    tokens: ['mohre'],
    officialDomains: ['mohre.gov.ae'],
    isUaeEntity: true,
  },
  {
    name: 'Central Bank of the UAE',
    tokens: ['cbuae', 'centralbank-uae', 'uae-centralbank'],
    officialDomains: ['centralbank.ae'],
    isUaeEntity: true,
  },
  // UAE Banks & Fintech
  {
    name: 'Emirates NBD',
    tokens: ['emiratesnbd', 'enbd'],
    officialDomains: ['emiratesnbd.com', 'emiratesnbd.ae', 'liv.me'],
    isUaeEntity: true,
  },
  {
    name: 'ADCB',
    tokens: ['adcb'],
    officialDomains: ['adcb.com', 'adcbislamic.com'],
    isUaeEntity: true,
  },
  {
    name: 'First Abu Dhabi Bank (FAB)',
    tokens: ['bankfab', 'fab-bank', 'fabuae', 'firstabudhabibank'],
    keywords: ['fab'],
    officialDomains: ['bankfab.com'],
    isUaeEntity: true,
  },
  {
    name: 'Dubai Islamic Bank (DIB)',
    tokens: ['dib-uae', 'dubaiislamic'],
    keywords: ['dib'],
    officialDomains: ['dib.ae'],
    isUaeEntity: true,
  },
  {
    name: 'Abu Dhabi Islamic Bank (ADIB)',
    tokens: ['adib-uae', 'abudhabiislamic'],
    keywords: ['adib'],
    officialDomains: ['adib.ae', 'adib.com'],
    isUaeEntity: true,
  },
  {
    name: 'Sharjah Islamic Bank (SIB)',
    tokens: ['sib-uae', 'sharjahislamic'],
    officialDomains: ['sib.ae'],
    isUaeEntity: true,
  },
  {
    name: 'Commercial Bank of Dubai (CBD)',
    tokens: ['cbd-uae', 'cbdbank'],
    officialDomains: ['cbd.ae'],
    isUaeEntity: true,
  },
  {
    name: 'RAKBANK',
    tokens: ['rakbank'],
    officialDomains: ['rakbank.ae'],
    isUaeEntity: true,
  },
  {
    name: 'Al Hilal Bank',
    tokens: ['alhilalbank'],
    officialDomains: ['alhilalbank.ae'],
    isUaeEntity: true,
  },
  {
    name: 'Mashreq Bank',
    tokens: ['mashreq'],
    officialDomains: ['mashreq.com', 'mashreqbank.com', 'mashreqneo.com'],
    isUaeEntity: true,
  },
  {
    name: 'Wio Bank',
    tokens: ['wiobank', 'wio-bank'],
    officialDomains: ['wio.io'],
    isUaeEntity: true,
  },
  // Regional & Global High-Target Brands
  {
    name: 'Emirates Airlines',
    tokens: ['emirates-air', 'flyemirates'],
    officialDomains: ['emirates.com'],
    isUaeEntity: true,
  },
  {
    name: 'Careem',
    tokens: ['careem'],
    officialDomains: ['careem.com'],
    isUaeEntity: true,
  },
  {
    name: 'Talabat',
    tokens: ['talabat'],
    officialDomains: ['talabat.com'],
    isUaeEntity: true,
  },
  {
    name: 'Noon',
    tokens: ['noon-pay', 'noon-uae', 'noonshop'],
    officialDomains: ['noon.com'],
    isUaeEntity: true,
  },
  {
    name: 'Aramex',
    tokens: ['aramex'],
    officialDomains: ['aramex.com', 'aramex.ae'],
  },
  {
    name: 'DHL',
    tokens: ['dhl-express', 'dhl-track', 'dhl-delivery', 'dhlparcel'],
    officialDomains: ['dhl.com', 'dhl.de'],
  },
  {
    name: 'PayPal',
    tokens: ['paypal'],
    officialDomains: ['paypal.com', 'paypal.me', 'paypalobjects.com'],
  },
  {
    name: 'Apple / iCloud',
    tokens: ['appleid', 'icloud', 'apple-support', 'apple-verify'],
    officialDomains: ['apple.com', 'icloud.com'],
  },
  {
    name: 'Microsoft / Office 365',
    tokens: ['microsoft', 'office365', 'onedrive', 'sharepoint-login'],
    officialDomains: [
      'microsoft.com',
      'live.com',
      'office.com',
      'office365.com',
      'microsoft365.com',
      'microsoftonline.com',
      'sharepoint.com',
      'outlook.com',
      'azure.com',
      'windows.net',
    ],
  },
  {
    name: 'Google',
    tokens: ['google-verify', 'google-docs-login', 'accounts-google'],
    officialDomains: ['google.com', 'google.ae', 'goo.gl', 'googleapis.com', 'youtube.com', 'g.co'],
  },
  {
    name: 'Amazon',
    tokens: ['amazon'],
    officialDomains: [
      'amazon.com',
      'amazon.ae',
      'amazon.co.uk',
      'amazon.sa',
      'amazon.eg',
      'amazon.de',
      'amazon.in',
      'amazon.jobs',
      'amazonaws.com',
      'aboutamazon.com',
      'amzn.to',
    ],
  },
  {
    name: 'WhatsApp',
    tokens: ['whatsapp'],
    officialDomains: ['whatsapp.com', 'whatsapp.net', 'wa.me'],
  },
  {
    name: 'Netflix',
    tokens: ['netflix'],
    officialDomains: ['netflix.com'],
  },
  {
    name: 'LinkedIn',
    tokens: ['linkedin'],
    officialDomains: ['linkedin.com', 'lnkd.in'],
  },
  {
    name: 'Indeed',
    tokens: ['indeed-jobs', 'indeed-hire'],
    officialDomains: ['indeed.com', 'indeed.ae'],
  },
];

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array<number>(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        (prev[j] ?? 0) + 1,
        (curr[j - 1] ?? 0) + 1,
        (prev[j - 1] ?? 0) + cost,
      );
    }
    for (let j = 0; j <= b.length; j++) {
      prev[j] = curr[j] ?? 0;
    }
  }
  return prev[b.length] ?? 0;
}

function normalizeLookalikes(input: string): string {
  return input
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'l')
    .replace(/3/g, 'e')
    .replace(/5/g, 's')
    .replace(/rn/g, 'm');
}

export interface BrandImpersonationMatch {
  brand: string;
  reason: string;
  isUaeEntity: boolean;
}

/** Words that, next to a short brand keyword in a hostname, signal a lure rather than a coincidence. */
const SCAM_CONTEXT_WORDS = new Set([
  'login', 'signin', 'sign', 'verify', 'verification', 'secure', 'security', 'pay', 'payment',
  'payments', 'fine', 'fines', 'bill', 'bills', 'billing', 'account', 'accounts', 'update',
  'renew', 'renewal', 'online', 'service', 'services', 'smartservices', 'eservices', 'uae', 'ae',
  'gov', 'support', 'help', 'id', 'bank', 'refund', 'delivery', 'track', 'tracking', 'portal',
  'card', 'otp', 'auth', 'recharge', 'topup', 'customer', 'official', 'violation', 'violations',
  'traffic', 'wallet', 'reward', 'rewards', 'gift', 'prize', 'kyc', 'now', 'alert',
]);

/**
 * Multi-tenant platforms where "<brand>.<platform>" is the brand's own legitimate tenant
 * (recruiting portals, corporate SharePoint, help desks). A brand name in the subdomain is normal here.
 */
const TENANT_PLATFORMS = [
  'myworkdayjobs.com', 'taleo.net', 'greenhouse.io', 'lever.co', 'smartrecruiters.com',
  'workable.com', 'successfactors.com', 'oraclecloud.com', 'bamboohr.com', 'zendesk.com',
  'freshdesk.com', 'salesforce.com', 'force.com', 'atlassian.net', 'service-now.com',
  'sharepoint.com',
];

/**
 * Free shared-hosting platforms routinely abused to park phishing pages. The host itself is
 * trustworthy, so the brand lure lives in the PATH (e.g. sites.google.com/view/uaepass-verify).
 */
const SHARED_HOSTING_HOSTS = [
  'sites.google.com', 'storage.googleapis.com', 'docs.google.com', 'forms.gle', 'sharepoint.com',
  'web.app', 'firebaseapp.com', 'pages.dev', 'workers.dev', 'r2.dev', 'github.io', 'netlify.app',
  'vercel.app', 'weebly.com', 'wixsite.com', 'blogspot.com', 'herokuapp.com', 'glitch.me',
];

function hostMatchesAny(host: string, domains: string[]): boolean {
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
}

/** True when the host is (a subdomain of) an official domain of any protected brand. */
export function isOfficialBrandDomain(hostname: string, registrableDomain?: string | null): boolean {
  const hostLower = hostname.toLowerCase();
  const regLower = (registrableDomain ?? hostLower).toLowerCase();
  return PROTECTED_BRANDS.some((entry) =>
    entry.officialDomains.some(
      (official) => regLower === official || hostLower === official || hostLower.endsWith(`.${official}`),
    ),
  );
}

function safePathname(fullUrl: string): string {
  try {
    return decodeURIComponent(new URL(fullUrl).pathname).toLowerCase();
  } catch {
    return '';
  }
}

export function detectBrandImpersonation(
  hostname: string,
  registrableDomain: string | null,
  fullUrl: string,
): BrandImpersonationMatch | null {
  const hostLower = hostname.toLowerCase();
  const regLower = (registrableDomain ?? hostLower).toLowerCase();
  const sld = regLower.split('.')[0] ?? '';
  const normalizedSld = normalizeLookalikes(sld);
  const pathLower = safePathname(fullUrl);
  const publicSuffix = regLower.includes('.') ? regLower.slice(regLower.indexOf('.') + 1) : '';

  const match = (entry: BrandEntry, reason: string): BrandImpersonationMatch => ({
    brand: entry.name,
    reason,
    isUaeEntity: Boolean(entry.isUaeEntity),
  });

  // 0. Phishing parked on free shared hosting: the lure is in the path, not the (trusted) host
  if (hostMatchesAny(hostLower, SHARED_HOSTING_HOSTS)) {
    for (const entry of PROTECTED_BRANDS) {
      for (const token of entry.tokens) {
        const cleanToken = token.toLowerCase();
        if (cleanToken.length >= 4 && pathLower.includes(cleanToken)) {
          return match(
            entry,
            `Page hosted on shared platform "${hostLower}" uses "${cleanToken}" in its address, not on an official ${entry.name} domain`,
          );
        }
      }
    }
  }

  // Never flag a verified official domain of ANY protected brand as impersonating another similar-named brand
  if (isOfficialBrandDomain(hostLower, regLower)) {
    return null;
  }

  // A brand's own tenant on a recruiting / help-desk / collaboration platform is legitimate
  const isTenantPlatform = hostMatchesAny(hostLower, TENANT_PLATFORMS);

  // Host labels without the public suffix, split on dots, hyphens and underscores
  const hostWithoutSuffix =
    publicSuffix && hostLower.endsWith(`.${publicSuffix}`)
      ? hostLower.slice(0, -(publicSuffix.length + 1))
      : hostLower;
  const labels = hostWithoutSuffix.split(/[.\-_]+/).filter(Boolean);

  for (const entry of PROTECTED_BRANDS) {
    for (const token of entry.tokens) {
      const cleanToken = token.toLowerCase();

      // 1. Subdomain or domain contains exact brand token while registrable domain is NOT official
      if (!isTenantPlatform && hostLower.includes(cleanToken)) {
        return match(
          entry,
          `Domain "${hostLower}" embeds "${cleanToken}" while hosted on unofficial domain "${regLower}"`,
        );
      }

      // 2. Lookalike substitution (e.g. paypa1, emiratesnbd -> emlratesnbd, arnazon)
      if (cleanToken.length >= 5 && !cleanToken.includes('-')) {
        if (normalizedSld === cleanToken && sld !== cleanToken) {
          return match(
            entry,
            `Domain "${regLower}" uses character-substitution typosquatting targeting ${entry.name}`,
          );
        }

        // One-edit typos only for long names: short ones collide with real words
        // (cloud/icloud, career/careem, paypay/paypal).
        if (cleanToken.length >= 7 && Math.abs(sld.length - cleanToken.length) <= 1) {
          if (levenshtein(sld, cleanToken) === 1) {
            return match(entry, `Domain "${regLower}" is 1-character typosquatting of ${entry.name}`);
          }
        }
      }
    }
  }

  // Official-domain rules run after every brand token had its chance, so the most specific
  // brand wins ("adpolice.gov.ae.evil.xyz" is Abu Dhabi Police, not the generic gov.ae entry).
  let embedded: { entry: BrandEntry; official: string } | null = null;
  for (const entry of PROTECTED_BRANDS) {
    for (const official of entry.officialDomains) {
      // 3. Character-substitution of an official domain name itself (g00gle.com, amaz0n.com)
      const officialSld = official.split('.')[0] ?? '';
      if (officialSld.length >= 5 && normalizedSld === officialSld && sld !== officialSld) {
        return match(
          entry,
          `Domain "${regLower}" uses character-substitution typosquatting targeting ${entry.name}`,
        );
      }

      // 4. Official domain string embedded at a boundary in subdomain/path of unrelated domain
      // (e.g. uaepass.ae.evil.xyz or evil.xyz/uaepass.ae/login). Query strings are ignored:
      // "?next=https://paypal.com" on an unrelated site is not impersonation.
      // Must check boundaries so legitimate domains like adib.ae are never substring-matched against dib.ae
      const embeddedInSubdomain =
        hostLower.startsWith(`${official}.`) ||
        hostLower.includes(`.${official}.`) ||
        hostLower.includes(`-${official}`);
      const embeddedInPath = pathLower.includes(`/${official}`);
      if (
        official.length >= 6 &&
        (embeddedInSubdomain || embeddedInPath) &&
        (!embedded || official.length > embedded.official.length)
      ) {
        embedded = { entry, official };
      }
    }
  }
  if (embedded) {
    return match(
      embedded.entry,
      `Unofficial domain "${regLower}" embeds official domain string "${embedded.official}" in URL`,
    );
  }

  for (const entry of PROTECTED_BRANDS) {
    // 5. Short brand keyword as a whole label next to a scam-context word (tamm-login, fab-secure, du-bill)
    if (!isTenantPlatform && entry.keywords) {
      for (const keyword of entry.keywords) {
        if (!labels.includes(keyword)) continue;
        const contextWord = labels.find((l) => l !== keyword && SCAM_CONTEXT_WORDS.has(l));
        if (contextWord) {
          return match(
            entry,
            `Domain "${hostLower}" pairs the name "${keyword}" with "${contextWord}" but is not an official ${entry.name} domain`,
          );
        }
      }
    }
  }

  return null;
}
