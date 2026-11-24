import type {
  BilingualFlag,
  DnsCheck,
  DomainRegistration,
  PromptInjectionReport,
  ScanMode,
  ScanResponse,
  TechnicalChecks,
  TlsCheck,
} from '@scamhisn/shared';
import { buildUnavailableAnalysis } from '../ai/aiChain.js';
import type { BrowserInspectionResult } from '../inspectors/browserInspector.js';
import { runHeuristicAnalysis } from '../inspectors/heuristicAnalyzer.js';
import { computeDecisiveScore } from '../scoring/scoringEngine.js';
import { determineCoverage, guardVerdict } from './coverage.js';

/**
 * Scam links die fast: by the time a victim (or a judge) checks one, the domain is often already
 * taken down or never existed. Returning "could not resolve" teaches the user nothing.
 *
 * This builds a full verdict from the address alone — brand impersonation, look-alike spelling,
 * high-abuse TLD, punycode, raw IP, registration age if the registry still knows the name — and
 * labels it clearly as an address-only result.
 */

export interface AddressOnlyScanInput {
  scanId: string;
  startedAt: number;
  mode: ScanMode;
  url: URL;
  registration: DomainRegistration;
  dnsErrorCode: string;
}

// Findings that describe a live page or live DNS; meaningless for a domain that does not resolve
const LIVE_ONLY_FLAG_CODES = new Set(['NO_EMAIL_INFRASTRUCTURE', 'MISSING_SECURITY_HEADERS']);

function emptyBrowserResult(url: URL, error: string): BrowserInspectionResult {
  return {
    captured: false,
    error,
    initialUrl: url.toString(),
    finalUrl: url.toString(),
    httpStatus: null,
    responseHeaders: {},
    redirectChain: [],
    maxHopsExceeded: false,
    title: null,
    metaTags: {},
    jsonLdBlocks: [],
    visibleText: '',
    forms: [],
    hasPasswordInput: false,
    hasOtpInput: false,
    hasPaymentInput: false,
    hasGovIdInput: false,
    externalFormActions: [],
    hiddenElementCount: 0,
    hiddenDomTexts: [],
    suspiciousHiddenSnippets: [],
    htmlComments: [],
    ariaAndDataAttrs: [],
    externalScriptDomains: [],
    iframeDomains: [],
    obfuscatedScriptIndicators: [],
    exfiltrationEndpoints: [],
    metaRefreshTarget: null,
    coordinates: null,
    mapReviews: [],
    extractedPhones: [],
    extractedEmails: [],
    socialMessagingLinks: [],
  };
}

function uncheckedTls(url: URL): TlsCheck {
  return {
    isHttps: url.protocol === 'https:',
    checked: false,
    valid: false,
    authorized: false,
    authorizationError: null,
    selfSigned: false,
    expired: false,
    notYetValid: false,
    hostnameMismatch: false,
    issuer: null,
    subject: null,
    subjectAltNames: [],
    validFrom: null,
    validTo: null,
    daysRemaining: null,
    protocol: null,
    error: 'Not checked: domain does not resolve',
  };
}

const EMPTY_DNS: DnsCheck = {
  aRecords: [],
  aaaaRecords: [],
  mxRecords: [],
  hasSpf: false,
  hasDmarc: false,
};

const NO_PROMPT_INJECTION: PromptInjectionReport = {
  detected: false,
  severity: 'none',
  zeroWidthCharCount: 0,
  unicodeTagSmugglingDetected: false,
  hiddenDomInjectionDetected: false,
  reviewInjectionDetected: false,
  findings: [],
};

export function buildAddressOnlyScan(input: AddressOnlyScanInput): ScanResponse {
  const { url, registration, mode } = input;
  const host = url.hostname.toLowerCase();
  const browser = emptyBrowserResult(url, `Domain does not resolve (${input.dnsErrorCode})`);
  const tls = uncheckedTls(url);

  const heuristics = runHeuristicAnalysis({
    initialUrl: url,
    finalUrl: url,
    tls,
    registration,
    dns: EMPTY_DNS,
    browser,
  });

  const impersonated = heuristics.anomalies.impersonatedBrand;

  const aiAnalysis = {
    ...buildUnavailableAnalysis(`Domain does not resolve (${input.dnsErrorCode}); address-only analysis.`, {
      model: 'none',
      configured: true,
    }),
    summaryEn: impersonated
      ? `This address is offline, but the name itself imitates ${impersonated} and is not one of its official domains. Treat any message that sent you here as a scam.`
      : 'This address does not exist or is already offline, so the page could not be opened. The result below is based on the address itself.',
    summaryAr: impersonated
      ? `هذا العنوان متوقف حالياً، لكن الاسم نفسه ينتحل ${impersonated} وليس من نطاقاتها الرسمية. اعتبر أي رسالة أرسلت لك هذا الرابط محاولة احتيال.`
      : 'هذا العنوان غير موجود أو متوقف حالياً، لذلك تعذّر فتح الصفحة. النتيجة تحت مبنية على العنوان نفسه فقط.',
    recommendationEn:
      'Do not trust the message that contained this link. Reach the organisation yourself through its official app or website.',
    recommendationAr: 'لا تثق بالرسالة اللي فيها هذا الرابط. تواصل مع الجهة بنفسك من تطبيقها أو موقعها الرسمي.',
  };

  const offlineFlag: BilingualFlag = {
    code: 'DOMAIN_OFFLINE',
    severity: 'medium',
    category: 'network',
    titleEn: 'Domain Does Not Exist or Is Offline',
    titleAr: 'النطاق غير موجود أو متوقف',
    detailEn: `"${host}" has no DNS records (${input.dnsErrorCode}). Scam sites are often taken down within days, so this verdict is based on the address alone.`,
    detailAr: `النطاق "${host}" ما له سجلات DNS (${input.dnsErrorCode}). مواقع الاحتيال غالباً تُحذف خلال أيام، لذلك النتيجة مبنية على العنوان فقط.`,
  };

  const technicalChecks: TechnicalChecks = {
    ssrf: { passed: true, resolvedIps: [] },
    tls,
    domainRegistration: registration,
    redirects: heuristics.redirects,
    headers: heuristics.headers,
    dns: EMPTY_DNS,
    domAndForms: heuristics.domAndForms,
    anomalies: heuristics.anomalies,
  };

  const scoring = computeDecisiveScore({
    mode,
    technicalChecks,
    heuristicFlags: [
      ...heuristics.flags.filter((f) => !LIVE_ONLY_FLAG_CODES.has(f.code)),
      offlineFlag,
    ],
    promptInjection: NO_PROMPT_INJECTION,
    aiAnalysis,
  });

  const coverage = determineCoverage({
    domainResolved: false,
    pageLoaded: false,
    aiStatus: 'unavailable',
    aiProvider: 'none',
    aiModel: null,
  });

  return {
    scanId: input.scanId,
    scannedAt: new Date().toISOString(),
    durationMs: Date.now() - input.startedAt,
    mode,
    inputUrl: url.toString(),
    finalUrl: url.toString(),
    scamScore: scoring.scamScore,
    verdict: guardVerdict(scoring.verdict, coverage),
    scoreBreakdown: scoring.scoreBreakdown,
    smokingGunsTriggered: scoring.smokingGunsTriggered,
    redFlags: scoring.redFlags,
    technicalChecks,
    promptInjection: NO_PROMPT_INJECTION,
    aiAnalysis,
    coverage,
  };
}
