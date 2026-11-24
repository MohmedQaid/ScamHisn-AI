import test from 'node:test';
import assert from 'node:assert/strict';
import { parse as parseDomain } from 'tldts';
import { detectBrandImpersonation, isOfficialBrandDomain } from '../security/brandCatalog.js';

function detect(rawUrl: string) {
  const url = new URL(rawUrl.includes('://') ? rawUrl : `https://${rawUrl}`);
  const host = url.hostname.toLowerCase();
  return detectBrandImpersonation(host, parseDomain(host).domain ?? null, url.toString());
}

// --- Genuine sites must never be accused of impersonation -------------------

const LEGITIMATE = [
  // Official UAE entities
  'www.adpolice.gov.ae',
  'tamm.abudhabi',
  'u.ae',
  'uaepass.ae',
  'icp.gov.ae',
  'www.moi.gov.ae',
  'www.bankfab.com',
  'www.adib.ae',
  'www.dib.ae',
  'www.adcb.com',
  'www.du.ae',
  'www.etisalat.ae',
  'www.addc.ae',
  // Brand-owned domains that are not the main .com
  'www.amazon.jobs',
  's3.amazonaws.com',
  'www.amazon.eg',
  'www.aboutamazon.com',
  'www.microsoft365.com',
  'www.paypalobjects.com',
  'www.adnocgas.ae',
  'www.adcbislamic.com',
  'www.aramex.ae',
  // Real, unrelated businesses one edit away from a brand name
  'cloud.com',
  'career.com',
  'paypay.ne.jp',
  // Words that merely contain a short brand keyword
  'fabric.com',
  'www.dubizzle.com',
  // A brand's own recruiting or tenant portal on a multi-tenant platform
  'adnoc.taleo.net',
  'amazon.myworkdayjobs.com',
  'adcb.sharepoint.com',
  // An official domain appearing only inside a query string
  'https://example.com/login?next=https://paypal.com/signin',
];

for (const url of LEGITIMATE) {
  test(`legitimate, not flagged: ${url}`, () => {
    assert.equal(detect(url), null);
  });
}

// --- Look-alikes must be attributed to the brand they imitate ---------------

const IMPERSONATIONS: Array<[url: string, brandIncludes: string]> = [
  ['adpolice-fines-pay.top/verify', 'Abu Dhabi Police'],
  ['abudhabi-police-fines.com', 'Abu Dhabi Police'],
  ['adpolice.gov.ae.fines-payment.xyz/login', 'Abu Dhabi Police'],
  ['tamm-login.xyz', 'TAMM'],
  ['tamm.services-ae.com', 'TAMM'],
  ['uaepass-login.verify-account.xyz', 'UAE PASS'],
  ['https://evil.xyz/uaepass.ae/login', 'UAE PASS'],
  ['emiratesid-renew.com', 'Emirates ID'],
  ['icp-smartservices.com', 'ICP'],
  ['moi-fines.ae.pay-now.top', 'Ministry of Interior'],
  ['fab-secure-login.com', 'First Abu Dhabi Bank'],
  ['dib-online.net', 'Dubai Islamic Bank'],
  ['adib-verify.com', 'Abu Dhabi Islamic Bank'],
  ['du-bill-pay.com', 'du'],
  ['darb-fines.com', 'Darb'],
  ['addc-bill.com', 'ADDC'],
  ['salik-uae-pay.top', 'Salik'],
  ['emiratespost-ae.top', 'Emirates Post'],
  ['g00gle.com', 'Google'],
  ['paypa1.com', 'PayPal'],
  // Phishing pages parked on free shared hosting
  ['https://sites.google.com/view/uaepass-verify', 'UAE PASS'],
  ['https://storage.googleapis.com/x/uaepass-login.html', 'UAE PASS'],
  ['https://evil.sharepoint.com/sites/adcb-login', 'ADCB'],
];

for (const [url, brand] of IMPERSONATIONS) {
  test(`impersonation flagged: ${url} -> ${brand}`, () => {
    const match = detect(url);
    assert.ok(match, `expected a brand match for ${url}`);
    assert.ok(
      match.brand.includes(brand),
      `expected brand containing "${brand}", got "${match.brand}"`,
    );
  });
}

test('isOfficialBrandDomain recognises official hosts and rejects look-alikes', () => {
  assert.equal(isOfficialBrandDomain('www.adpolice.gov.ae'), true);
  assert.equal(isOfficialBrandDomain('tamm.abudhabi'), true);
  assert.equal(isOfficialBrandDomain('adpolice-fines-pay.top'), false);
});
