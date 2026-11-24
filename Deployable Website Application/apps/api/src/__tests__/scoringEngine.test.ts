import test from 'node:test';
import assert from 'node:assert/strict';
import type { AiForensicAnalysis, TechnicalChecks, TlsCheck } from '@scamhisn/shared';
import { computeDecisiveScore, type ScoringInput } from '../scoring/scoringEngine.js';

const GOOD_TLS: TlsCheck = {
  isHttps: true,
  checked: true,
  valid: true,
  authorized: true,
  authorizationError: null,
  selfSigned: false,
  expired: false,
  notYetValid: false,
  hostnameMismatch: false,
  issuer: 'Test CA',
  subject: 'example.ae',
  subjectAltNames: [],
  validFrom: null,
  validTo: null,
  daysRemaining: 200,
  protocol: 'TLSv1.3',
  error: null,
};

function checks(tls: Partial<TlsCheck> = {}): TechnicalChecks {
  return {
    ssrf: { passed: true, resolvedIps: ['203.0.113.10'] },
    tls: { ...GOOD_TLS, ...tls },
    domainRegistration: {
      registrableDomain: 'example.ae',
      source: 'rdap',
      createdAt: '2010-01-01T00:00:00Z',
      expiresAt: null,
      registrar: 'Test',
      domainAgeDays: 6000,
      isNewlyRegistered: false,
      isYoungDomain: false,
      statuses: [],
      error: null,
    },
    redirects: {
      initialUrl: 'https://example.ae/',
      finalUrl: 'https://example.ae/',
      hopCount: 0,
      maxHopsExceeded: false,
      crossDomainRedirect: false,
      chain: [],
    },
    headers: {
      httpStatus: 200,
      hsts: true,
      csp: true,
      xFrameOptions: true,
      xContentTypeOptions: true,
      referrerPolicy: true,
      missingCriticalHeaders: [],
    },
    dns: { aRecords: ['203.0.113.10'], aaaaRecords: [], mxRecords: ['mx.example.ae'], hasSpf: true, hasDmarc: true },
    domAndForms: {
      browserCaptured: true,
      browserError: null,
      title: 'Example',
      formCount: 0,
      hasPasswordInput: false,
      hasOtpInput: false,
      hasPaymentInput: false,
      hasGovIdInput: false,
      hasSensitiveInputs: false,
      externalFormActions: [],
      hiddenElementCount: 0,
      suspiciousHiddenSnippets: [],
      externalScriptDomains: [],
      iframeDomains: [],
      obfuscatedScriptIndicators: [],
      exfiltrationEndpoints: [],
    },
    anomalies: {
      isPunycode: false,
      unicodeDomain: null,
      hasMixedScriptHomograph: false,
      suspiciousTld: false,
      tld: 'ae',
      excessiveSubdomains: false,
      subdomainDepth: 0,
      usesRawIp: false,
      hasEmbeddedCredentials: false,
      isUrlShortener: false,
      impersonatedBrand: null,
      impersonationReason: null,
      phishingKitIndicators: [],
    },
  };
}

function ai(overrides: Partial<AiForensicAnalysis> = {}): AiForensicAnalysis {
  return {
    status: 'completed',
    error: null,
    model: 'test',
    groundingUsed: ['google_search'],
    groundingSources: [],
    aiScamScore: 5,
    confidence: 'medium',
    aiDetectedPromptInjection: false,
    promptInjectionEvidence: null,
    impersonatedEntity: null,
    provablyFalseOrImpersonatedClaim: false,
    confirmedPhishingOrScam: false,
    summaryEn: '',
    summaryAr: '',
    recommendationEn: '',
    recommendationAr: '',
    keyFindings: [],
    jobAnalysis: null,
    mapAnalysis: null,
    ...overrides,
  };
}

function input(overrides: Partial<ScoringInput> = {}): ScoringInput {
  return {
    mode: 'general',
    technicalChecks: checks(),
    heuristicFlags: [],
    promptInjection: {
      detected: false,
      severity: 'none',
      zeroWidthCharCount: 0,
      unicodeTagSmugglingDetected: false,
      hiddenDomInjectionDetected: false,
      reviewInjectionDetected: false,
      findings: [],
    },
    aiAnalysis: ai(),
    ...overrides,
  };
}

// --- A certificate we could not fully verify is not proof of a scam ----------

test('an incomplete certificate chain does not make a clean site "suspicious"', () => {
  // Browsers fetch missing intermediates; Node does not. Common on real government sites.
  const result = computeDecisiveScore(
    input({
      technicalChecks: checks({
        valid: false,
        authorized: false,
        authorizationError: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
      }),
    }),
  );
  assert.ok(result.scamScore < 45, `score was ${result.scamScore}`);
});

test('a TLS handshake timeout does not make a clean site "suspicious"', () => {
  const result = computeDecisiveScore(
    input({
      technicalChecks: checks({ valid: false, authorized: false, authorizationError: 'TLS_TIMEOUT' }),
    }),
  );
  assert.ok(result.scamScore < 45, `score was ${result.scamScore}`);
});

test('an expired certificate still raises the score sharply', () => {
  const result = computeDecisiveScore(
    input({
      technicalChecks: checks({
        valid: false,
        authorized: false,
        expired: true,
        authorizationError: 'CERT_HAS_EXPIRED',
      }),
    }),
  );
  assert.ok(result.scamScore >= 75, `score was ${result.scamScore}`);
});

// --- "Could not verify" is not the same as "fraud" ---------------------------

const UNVERIFIED_PLACE = {
  placeVerified: false,
  placeName: null,
  coordinates: null,
  businessExistsOnExternalSources: false,
  contactHijackingSuspected: false,
  reviewInjectionOrScamLinksFound: false,
  verificationNotesEn: 'Plain coordinates, no business to verify.',
  verificationNotesAr: '',
};

test('a plain map pin with no business is not scored as suspicious', () => {
  const result = computeDecisiveScore(
    input({ mode: 'map', aiAnalysis: ai({ aiScamScore: 8, mapAnalysis: UNVERIFIED_PLACE }) }),
  );
  assert.ok(result.scamScore < 45, `score was ${result.scamScore}`);
});

test('an unverifiable listing the AI also distrusts is still raised', () => {
  const result = computeDecisiveScore(
    input({ mode: 'map', aiAnalysis: ai({ aiScamScore: 60, mapAnalysis: UNVERIFIED_PLACE }) }),
  );
  assert.ok(result.scamScore >= 72, `score was ${result.scamScore}`);
});

const NO_JOB_ON_PAGE = {
  linkLegitimate: true,
  jobAuthenticityScore: 5,
  companyVerified: true,
  companyName: 'Example LLC',
  verificationNotesEn: 'No job posting found on this page.',
  verificationNotesAr: '',
  redFlagsEn: [],
  redFlagsAr: [],
};

test('a genuine company page with no job post is not called a confirmed job scam', () => {
  const result = computeDecisiveScore(
    input({ mode: 'job', aiAnalysis: ai({ aiScamScore: 10, jobAnalysis: NO_JOB_ON_PAGE }) }),
  );
  assert.ok(result.scamScore < 45, `score was ${result.scamScore}`);
});

test('a fake job the AI rates as a scam is still escalated', () => {
  const result = computeDecisiveScore(
    input({
      mode: 'job',
      aiAnalysis: ai({
        aiScamScore: 85,
        jobAnalysis: { ...NO_JOB_ON_PAGE, linkLegitimate: false, companyVerified: false },
      }),
    }),
  );
  assert.ok(result.scamScore >= 95, `score was ${result.scamScore}`);
});

// --- A verified official domain is not doubted on a model's vague unease -----

test('an official domain with clean technical checks stays safe when the AI merely hedges', () => {
  // Seen for real: a small local model gave adpolice.gov.ae 45% for "missing security headers"
  const result = computeDecisiveScore(
    input({ isOfficialDomain: true, aiAnalysis: ai({ aiScamScore: 45, confidence: 'medium' }) }),
  );
  assert.equal(result.verdict, 'safe');
  assert.ok(result.scamScore <= 19, `score was ${result.scamScore}`);
  // The model's own number is still reported for transparency
  assert.equal(result.scoreBreakdown.aiScamScore, 45);
});

test('the same hedge on an unknown domain is not suppressed', () => {
  const result = computeDecisiveScore(input({ aiAnalysis: ai({ aiScamScore: 45, confidence: 'medium' }) }));
  assert.equal(result.scamScore, 45);
});

test('an official domain is still flagged when the AI is confident the page is a scam', () => {
  // A compromised official site: concrete evidence overrides the list
  const result = computeDecisiveScore(
    input({
      isOfficialDomain: true,
      aiAnalysis: ai({ aiScamScore: 97, confidence: 'high', confirmedPhishingOrScam: true }),
    }),
  );
  assert.ok(result.scamScore >= 95, `score was ${result.scamScore}`);
});
