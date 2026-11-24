export interface BrandEntry {
  name: string;
  tokens: string[];
  officialDomains: string[];
  isUaeEntity?: boolean;
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
    officialDomains: ['tamm.abudhabi'],
    isUaeEntity: true,
  },
  {
    name: 'ICP UAE (Federal Authority for Identity & Citizenship)',
    tokens: ['icp-uae', 'smartservices-icp', 'ica-gov'],
    officialDomains: ['icp.gov.ae', 'ica.gov.ae'],
    isUaeEntity: true,
  },
  {
    name: 'Ministry of Interior UAE (MOI)',
    tokens: ['moi-uae', 'moi-gov'],
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
    tokens: ['adpolice', 'abudhabipolice'],
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
    officialDomains: ['du.ae'],
    isUaeEntity: true,
  },
  {
    name: 'ADNOC',
    tokens: ['adnoc'],
    officialDomains: ['adnoc.ae', 'adnocdistribution.ae'],
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
    officialDomains: ['adcb.com'],
    isUaeEntity: true,
  },
  {
    name: 'First Abu Dhabi Bank (FAB)',
    tokens: ['bankfab', 'fab-bank', 'fabuae'],
    officialDomains: ['bankfab.com'],
    isUaeEntity: true,
  },
  {
    name: 'Dubai Islamic Bank (DIB)',
    tokens: ['dib-uae', 'dubaiislamic'],
    officialDomains: ['dib.ae'],
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
    officialDomains: ['aramex.com'],
  },
  {
    name: 'DHL',
    tokens: ['dhl-express', 'dhl-track', 'dhl-delivery', 'dhlparcel'],
    officialDomains: ['dhl.com', 'dhl.de'],
  },
  {
    name: 'PayPal',
    tokens: ['paypal'],
    officialDomains: ['paypal.com', 'paypal.me'],
  },
  {
    name: 'Apple / iCloud',
    tokens: ['appleid', 'icloud', 'apple-support', 'apple-verify'],
    officialDomains: ['apple.com', 'icloud.com'],
  },
  {
    name: 'Microsoft / Office 365',
    tokens: ['microsoft', 'office365', 'onedrive', 'sharepoint-login'],
    officialDomains: ['microsoft.com', 'live.com', 'office.com', 'microsoftonline.com', 'sharepoint.com'],
  },
  {
    name: 'Google',
    tokens: ['google-verify', 'google-docs-login', 'accounts-google'],
    officialDomains: ['google.com', 'google.ae', 'goo.gl', 'googleapis.com', 'youtube.com', 'g.co'],
  },
  {
    name: 'Amazon',
    tokens: ['amazon'],
    officialDomains: ['amazon.com', 'amazon.ae', 'amazon.co.uk', 'amazon.sa', 'amzn.to'],
  },
  {
    name: 'WhatsApp',
    tokens: ['whatsapp'],
    officialDomains: ['whatsapp.com', 'wa.me'],
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

export function detectBrandImpersonation(
  hostname: string,
  registrableDomain: string | null,
  fullUrl: string,
): BrandImpersonationMatch | null {
  const hostLower = hostname.toLowerCase();
  const regLower = (registrableDomain ?? hostLower).toLowerCase();
  const sld = regLower.split('.')[0] ?? '';
  const normalizedSld = normalizeLookalikes(sld);
  const urlLower = fullUrl.toLowerCase();

  for (const entry of PROTECTED_BRANDS) {
    const isOfficial = entry.officialDomains.some(
      (official) => regLower === official || hostLower === official || hostLower.endsWith(`.${official}`),
    );
    if (isOfficial) {
      continue;
    }

    for (const token of entry.tokens) {
      const cleanToken = token.toLowerCase();
      // 1. Subdomain or domain contains exact brand token while registrable domain is NOT official
      if (hostLower.includes(cleanToken)) {
        return {
          brand: entry.name,
          reason: `Domain "${hostLower}" embeds "${cleanToken}" while hosted on unofficial domain "${regLower}"`,
          isUaeEntity: Boolean(entry.isUaeEntity),
        };
      }

      // 2. Lookalike substitution (e.g. paypa1, emiratesnbd -> emlratesnbd, arnazon)
      if (cleanToken.length >= 5 && !cleanToken.includes('-')) {
        if (normalizedSld === cleanToken && sld !== cleanToken) {
          return {
            brand: entry.name,
            reason: `Domain "${regLower}" uses character-substitution typosquatting targeting ${entry.name}`,
            isUaeEntity: Boolean(entry.isUaeEntity),
          };
        }

        if (sld.length >= 5 && Math.abs(sld.length - cleanToken.length) <= 1) {
          const dist = levenshtein(sld, cleanToken);
          if (dist === 1) {
            return {
              brand: entry.name,
              reason: `Domain "${regLower}" is 1-character typosquatting of ${entry.name}`,
              isUaeEntity: Boolean(entry.isUaeEntity),
            };
          }
        }
      }

      // 3. Official domain string embedded in subdomain/path of unrelated domain (e.g. evil.xyz/uaepass.ae/login)
      for (const official of entry.officialDomains) {
        if (official.length >= 6 && (hostLower.includes(official) || urlLower.includes(`/${official}`))) {
          return {
            brand: entry.name,
            reason: `Unofficial domain "${regLower}" embeds official domain string "${official}" in URL`,
            isUaeEntity: Boolean(entry.isUaeEntity),
          };
        }
      }
    }
  }

  return null;
}
