import test from 'node:test';
import assert from 'node:assert/strict';
import { determineCoverage, guardVerdict } from '../services/coverage.js';
import { extractFirstUrl } from '../security/inputExtractor.js';
import { buildAddressOnlyScan } from '../services/addressOnlyScan.js';

// --- How much of the analysis actually ran ----------------------------------

test('coverage is full when the page loaded and a grounded AI answered', () => {
  const c = determineCoverage({
    domainResolved: true,
    pageLoaded: true,
    aiStatus: 'completed',
    aiProvider: 'gemini',
    aiModel: 'gemini-x',
  });
  assert.equal(c.level, 'full');
  assert.equal(c.liveSourcesChecked, true);
});

test('coverage is partial when a backup model answered without live lookups', () => {
  const c = determineCoverage({
    domainResolved: true,
    pageLoaded: true,
    aiStatus: 'degraded',
    aiProvider: 'local',
    aiModel: 'jais-2-8b-chat',
  });
  assert.equal(c.level, 'partial');
  assert.equal(c.liveSourcesChecked, false);
});

test('coverage is partial when the page could not be opened', () => {
  const c = determineCoverage({
    domainResolved: true,
    pageLoaded: false,
    aiStatus: 'completed',
    aiProvider: 'gemini',
    aiModel: 'gemini-x',
  });
  assert.equal(c.level, 'partial');
});

test('coverage is rules_only when no AI answered', () => {
  const c = determineCoverage({
    domainResolved: true,
    pageLoaded: true,
    aiStatus: 'unavailable',
    aiProvider: 'none',
    aiModel: null,
  });
  assert.equal(c.level, 'rules_only');
});

test('coverage is address_only when the domain does not resolve', () => {
  const c = determineCoverage({
    domainResolved: false,
    pageLoaded: false,
    aiStatus: 'unavailable',
    aiProvider: 'none',
    aiModel: null,
  });
  assert.equal(c.level, 'address_only');
});

test('an incomplete check is never reported as safe', () => {
  const rulesOnly = determineCoverage({
    domainResolved: true, pageLoaded: true, aiStatus: 'unavailable', aiProvider: 'none', aiModel: null,
  });
  const notLoaded = determineCoverage({
    domainResolved: true, pageLoaded: false, aiStatus: 'completed', aiProvider: 'gemini', aiModel: 'm',
  });
  const full = determineCoverage({
    domainResolved: true, pageLoaded: true, aiStatus: 'completed', aiProvider: 'gemini', aiModel: 'm',
  });
  const backup = determineCoverage({
    domainResolved: true, pageLoaded: true, aiStatus: 'degraded', aiProvider: 'local', aiModel: 'jais',
  });
  assert.equal(guardVerdict('safe', rulesOnly), 'caution');
  assert.equal(guardVerdict('safe', notLoaded), 'caution');
  assert.equal(guardVerdict('safe', full), 'safe');
  assert.equal(guardVerdict('safe', backup), 'safe');
  // A guard only ever makes the verdict more careful, never less.
  assert.equal(guardVerdict('confirmed_scam', rulesOnly), 'confirmed_scam');
});

// --- Pasting a whole SMS instead of a bare link -----------------------------

test('a plain link is returned unchanged', () => {
  assert.equal(extractFirstUrl('https://u.ae/en'), 'https://u.ae/en');
  assert.equal(extractFirstUrl('  tamm.abudhabi  '), 'tamm.abudhabi');
});

test('the link is pulled out of a pasted English SMS', () => {
  assert.equal(
    extractFirstUrl(
      'Abu Dhabi Police: you have an unpaid traffic fine of AED 150.50. Pay now at adpolice-fines.top/pay to avoid court.',
    ),
    'adpolice-fines.top/pay',
  );
});

test('the link is pulled out of a pasted Arabic SMS and trailing punctuation is dropped', () => {
  assert.equal(
    extractFirstUrl('عزيزي العميل، لديك مخالفة غير مدفوعة. ادفع الآن: https://salik-uae-pay.top/x؟'),
    'https://salik-uae-pay.top/x',
  );
});

test('email addresses and prices are not mistaken for links', () => {
  assert.equal(extractFirstUrl('Contact support@bank.ae or pay AED 12.50 today'), null);
});

test('text without any link yields null', () => {
  assert.equal(extractFirstUrl('Your parcel is on hold, call us now'), null);
});

// --- A fake link whose domain is already dead still gets a verdict ----------

const NO_REGISTRATION = {
  registrableDomain: null,
  source: 'unavailable' as const,
  createdAt: null,
  expiresAt: null,
  registrar: null,
  domainAgeDays: null,
  isNewlyRegistered: false,
  isYoungDomain: false,
  statuses: [],
  error: 'not found',
};

test('a dead look-alike of Abu Dhabi Police is reported as impersonation, not as an error', () => {
  const scan = buildAddressOnlyScan({
    scanId: 'test',
    startedAt: Date.now(),
    mode: 'general',
    url: new URL('https://adpolice-fines-pay.top/verify'),
    registration: NO_REGISTRATION,
    dnsErrorCode: 'ENOTFOUND',
  });
  assert.match(scan.technicalChecks.anomalies.impersonatedBrand ?? '', /Abu Dhabi Police/);
  assert.ok(scan.scamScore >= 75, `score was ${scan.scamScore}`);
  assert.ok(['high_risk', 'confirmed_scam'].includes(scan.verdict));
  assert.equal(scan.coverage?.level, 'address_only');
  assert.ok(scan.redFlags.some((f) => f.code === 'DOMAIN_OFFLINE'));
});

test('a dead domain with no warning signs is "caution", never "safe"', () => {
  const scan = buildAddressOnlyScan({
    scanId: 'test',
    startedAt: Date.now(),
    mode: 'general',
    url: new URL('https://my-grandmas-recipes-blog.com/'),
    registration: NO_REGISTRATION,
    dnsErrorCode: 'ENOTFOUND',
  });
  assert.equal(scan.technicalChecks.anomalies.impersonatedBrand, null);
  assert.equal(scan.verdict, 'caution');
  assert.equal(scan.coverage?.level, 'address_only');
});
