import { domainToUnicode } from 'node:url';
import { parse as parseDomain } from 'tldts';
import type {
  AnomalyCheck,
  BilingualFlag,
  DnsCheck,
  DomAndFormsCheck,
  DomainRegistration,
  RedirectCheck,
  SecurityHeadersCheck,
  TlsCheck,
} from '@scamhisn/shared';
import { detectBrandImpersonation } from '../security/brandCatalog.js';
import type { BrowserInspectionResult } from './browserInspector.js';

const HIGH_ABUSE_TLDS = new Set([
  'xyz',
  'top',
  'tk',
  'ml',
  'ga',
  'cf',
  'gq',
  'buzz',
  'icu',
  'vip',
  'work',
  'click',
  'loan',
  'zip',
  'mov',
  'cfd',
  'sbs',
  'rest',
  'monster',
  'cam',
  'surf',
  'quest',
  'beauty',
  'autos',
  'boats',
  'hair',
]);

const URL_SHORTENER_DOMAINS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'rb.gy',
  'cutt.ly',
  'is.gd',
  'v.gd',
  'ow.ly',
  'buff.ly',
  'shorturl.at',
  'tiny.cc',
  'rebrand.ly',
  'shrtco.de',
  's.id',
]);

const DISPOSABLE_FORM_HOSTS = ['formsubmit.co', 'getform.io', 'web3forms.com', 'formspree.io'];

function detectMixedScriptHomograph(unicodeHost: string): boolean {
  const labels = unicodeHost.split('.');
  for (const label of labels) {
    const hasLatin = /[a-z]/i.test(label);
    const hasCyrillic = /[\u0400-\u04FF]/.test(label);
    const hasGreek = /[\u0370-\u03FF]/.test(label);
    // Mixing Latin with Cyrillic or Greek in the same DNS label is a classic IDN homograph attack
    if ((hasLatin && hasCyrillic) || (hasLatin && hasGreek) || (hasCyrillic && hasGreek)) {
      return true;
    }
    // Pure Cyrillic/Greek impersonating common Latin TLDs (e.g. .com, .ae)
    if ((hasCyrillic || hasGreek) && !hasLatin) {
      return true;
    }
  }
  return false;
}

export interface HeuristicAnalysisInput {
  initialUrl: URL;
  finalUrl: URL;
  tls: TlsCheck;
  registration: DomainRegistration;
  dns: DnsCheck;
  browser: BrowserInspectionResult;
}

export interface HeuristicAnalysisOutput {
  redirects: RedirectCheck;
  headers: SecurityHeadersCheck;
  domAndForms: DomAndFormsCheck;
  anomalies: AnomalyCheck;
  flags: BilingualFlag[];
}

export function runHeuristicAnalysis(input: HeuristicAnalysisInput): HeuristicAnalysisOutput {
  const { initialUrl, finalUrl, tls, registration, dns, browser } = input;
  const flags: BilingualFlag[] = [];

  const finalHost = finalUrl.hostname.toLowerCase();
  const initialHost = initialUrl.hostname.toLowerCase();
  const parsedFinal = parseDomain(finalHost);
  const parsedInitial = parseDomain(initialHost);

  const registrableDomain = parsedFinal.domain ?? null;
  const initialRegDomain = parsedInitial.domain ?? null;
  const tld = parsedFinal.publicSuffix?.split('.').pop()?.toLowerCase() ?? null;

  // 1. Redirect Analysis
  const hopCount = Math.max(0, browser.redirectChain.length - 1);
  const crossDomainRedirect = Boolean(
    registrableDomain && initialRegDomain && registrableDomain !== initialRegDomain,
  );
  const redirects: RedirectCheck = {
    initialUrl: initialUrl.toString(),
    finalUrl: finalUrl.toString(),
    hopCount,
    maxHopsExceeded: browser.maxHopsExceeded,
    crossDomainRedirect,
    chain: browser.redirectChain,
  };

  if (browser.maxHopsExceeded || hopCount >= 4) {
    flags.push({
      code: 'EXCESSIVE_REDIRECTS',
      severity: 'high',
      category: 'redirect',
      titleEn: `Excessive Redirect Chain (${hopCount} hops)`,
      titleAr: `سلسلة تحويلات كثيرة (${hopCount} تحويلات)`,
      detailEn: `The link redirected ${hopCount} times before landing on ${finalHost}, a common cloaking technique.`,
      detailAr: `الرابط حوّلك ${hopCount} مرات لين وصل إلى ${finalHost}، وهذي طريقة شائعة لإخفاء الوجهة الحقيقية.`,
    });
  } else if (crossDomainRedirect) {
    flags.push({
      code: 'CROSS_DOMAIN_REDIRECT',
      severity: 'low',
      category: 'redirect',
      titleEn: `Redirects to Different Domain (${registrableDomain})`,
      titleAr: `التحويل لنطاق مختلف (${registrableDomain})`,
      detailEn: `The initial domain (${initialRegDomain}) redirected to a different domain (${registrableDomain}).`,
      detailAr: `النطاق الأصلي (${initialRegDomain}) حوّل الصفحة إلى نطاق ثاني (${registrableDomain}).`,
    });
  }

  // 2. HTTP Security Headers
  const h = browser.responseHeaders;
  const hsts = Boolean(h['strict-transport-security']);
  const csp = Boolean(h['content-security-policy']);
  const xFrameOptions = Boolean(h['x-frame-options']);
  const xContentTypeOptions = Boolean(h['x-content-type-options']);
  const referrerPolicy = Boolean(h['referrer-policy']);

  const missingCriticalHeaders: string[] = [];
  if (tls.isHttps && !hsts) missingCriticalHeaders.push('Strict-Transport-Security');
  if (!csp) missingCriticalHeaders.push('Content-Security-Policy');
  if (!xFrameOptions) missingCriticalHeaders.push('X-Frame-Options');

  const headers: SecurityHeadersCheck = {
    httpStatus: browser.httpStatus,
    hsts,
    csp,
    xFrameOptions,
    xContentTypeOptions,
    referrerPolicy,
    missingCriticalHeaders,
  };

  if (browser.captured && missingCriticalHeaders.length === 3) {
    flags.push({
      code: 'MISSING_SECURITY_HEADERS',
      severity: 'low',
      category: 'headers',
      titleEn: 'Missing Core HTTP Security Headers',
      titleAr: 'غياب ترويسات الحماية الأساسية (Security Headers)',
      detailEn: `Missing ${missingCriticalHeaders.join(', ')}. Legitimate financial and government portals normally enforce these headers.`,
      detailAr: `الموقع يفتقد ترويسات الحماية (${missingCriticalHeaders.join(', ')}) اللي عادةً تكون مفعّلة في المواقع الرسمية والبنكية.`,
    });
  }

  // 3. Punycode / IDN Homograph & URL Structural Anomalies
  const isPunycode = finalHost.includes('xn--') || initialHost.includes('xn--');
  const unicodeDomain = domainToUnicode(finalHost) || null;
  const hasMixedScriptHomograph = Boolean(
    isPunycode && unicodeDomain && detectMixedScriptHomograph(unicodeDomain),
  );
  const suspiciousTld = Boolean(tld && HIGH_ABUSE_TLDS.has(tld));
  const subdomainParts = parsedFinal.subdomain ? parsedFinal.subdomain.split('.').filter(Boolean) : [];
  const subdomainDepth = subdomainParts.length;
  const excessiveSubdomains = subdomainDepth >= 3;
  const usesRawIp = Boolean(parsedFinal.isIp);
  const hasEmbeddedCredentials = Boolean(
    initialUrl.username || initialUrl.password || finalUrl.username || finalUrl.password,
  );
  const isUrlShortener = Boolean(
    (initialRegDomain && URL_SHORTENER_DOMAINS.has(initialRegDomain)) ||
      (registrableDomain && URL_SHORTENER_DOMAINS.has(registrableDomain)),
  );

  // Check brand impersonation on both initial and final URL
  const brandMatch =
    detectBrandImpersonation(finalHost, registrableDomain, finalUrl.toString()) ??
    detectBrandImpersonation(initialHost, initialRegDomain, initialUrl.toString());

  // 4. DOM, Forms & Phishing-Kit Indicators
  const hasSensitiveInputs =
    browser.hasPasswordInput ||
    browser.hasOtpInput ||
    browser.hasPaymentInput ||
    browser.hasGovIdInput;

  const phishingKitIndicators: string[] = [...browser.obfuscatedScriptIndicators];

  for (const endpoint of browser.exfiltrationEndpoints) {
    phishingKitIndicators.push(endpoint);
  }

  // Check if any external form action posts to disposable form services
  for (const action of browser.externalFormActions) {
    if (DISPOSABLE_FORM_HOSTS.some((d) => action.toLowerCase().includes(d))) {
      phishingKitIndicators.push(`Form posts to disposable collector (${action})`);
    }
  }

  // Meta refresh redirect to a different registrable domain
  if (browser.metaRefreshTarget) {
    try {
      const targetUrl = new URL(browser.metaRefreshTarget, finalUrl);
      const targetReg = parseDomain(targetUrl.hostname).domain;
      if (targetReg && registrableDomain && targetReg !== registrableDomain) {
        phishingKitIndicators.push(`HTML meta-refresh redirect to third-party domain (${targetReg})`);
      }
    } catch {
      // ignore
    }
  }

  const domAndForms: DomAndFormsCheck = {
    browserCaptured: browser.captured,
    browserError: browser.error,
    title: browser.title,
    formCount: browser.forms.length,
    hasPasswordInput: browser.hasPasswordInput,
    hasOtpInput: browser.hasOtpInput,
    hasPaymentInput: browser.hasPaymentInput,
    hasGovIdInput: browser.hasGovIdInput,
    hasSensitiveInputs,
    externalFormActions: browser.externalFormActions,
    hiddenElementCount: browser.hiddenElementCount,
    suspiciousHiddenSnippets: browser.suspiciousHiddenSnippets,
    externalScriptDomains: browser.externalScriptDomains,
    iframeDomains: browser.iframeDomains,
    obfuscatedScriptIndicators: browser.obfuscatedScriptIndicators,
    exfiltrationEndpoints: browser.exfiltrationEndpoints,
  };

  const anomalies: AnomalyCheck = {
    isPunycode,
    unicodeDomain,
    hasMixedScriptHomograph,
    suspiciousTld,
    tld,
    excessiveSubdomains,
    subdomainDepth,
    usesRawIp,
    hasEmbeddedCredentials,
    isUrlShortener,
    impersonatedBrand: brandMatch?.brand ?? null,
    impersonationReason: brandMatch?.reason ?? null,
    phishingKitIndicators: Array.from(new Set(phishingKitIndicators)),
  };

  // --- Emit structured bilingual flags ---

  if (hasMixedScriptHomograph) {
    flags.push({
      code: 'IDN_HOMOGRAPH_SPOOFING',
      severity: 'critical',
      category: 'impersonation',
      titleEn: `IDN Homograph Spoofing Detected (${unicodeDomain})`,
      titleAr: `محاولة تزوير النطاق بأحرف متشابهة (${unicodeDomain})`,
      detailEn: `The domain uses Punycode (${finalHost}) mixing lookalike Unicode scripts to imitate a trusted brand.`,
      detailAr: `النطاق يستخدم ترميز Punycode (${finalHost}) وأحرف متشابهة شكلياً لخداع المستخدمين وتقليد موقع رسمي.`,
    });
  } else if (isPunycode) {
    flags.push({
      code: 'PUNYCODE_DOMAIN',
      severity: 'medium',
      category: 'domain',
      titleEn: `Internationalized Punycode Domain (${unicodeDomain})`,
      titleAr: `نطاق دولي مرمّز بـ Punycode (${unicodeDomain})`,
      detailEn: `Domain uses xn-- Punycode encoding (${finalHost}). Verify the exact spelling carefully.`,
      detailAr: `النطاق يستخدم ترميز xn-- (${finalHost})، تأكد زين من صحة الحروف قبل ما تدخل أي بيانات.`,
    });
  }

  if (brandMatch) {
    flags.push({
      code: 'BRAND_IMPERSONATION',
      severity: hasSensitiveInputs ? 'critical' : 'high',
      category: 'impersonation',
      titleEn: `Suspected Impersonation of ${brandMatch.brand}`,
      titleAr: `اشتباه انتحال هوية ${brandMatch.brand}`,
      detailEn: brandMatch.reason,
      detailAr: `الرابط يستخدم اسم "${brandMatch.brand}" لكنه مستضاف على نطاق غير رسمي (${registrableDomain ?? finalHost}).`,
    });
  }

  if (hasEmbeddedCredentials) {
    flags.push({
      code: 'URL_EMBEDDED_CREDENTIALS',
      severity: 'high',
      category: 'impersonation',
      titleEn: 'Deceptive "@" Authority Trick in URL',
      titleAr: 'حيلة رمز "@" المضللة داخل الرابط',
      detailEn: 'The URL embeds username/authority text before "@", a classic trick to disguise the real host.',
      detailAr: 'الرابط يحتوي على نص قبل رمز "@" وهذي خدعة معروفة لإخفاء اسم الموقع الحقيقي.',
    });
  }

  if (usesRawIp) {
    flags.push({
      code: 'RAW_IP_HOST',
      severity: 'high',
      category: 'domain',
      titleEn: `Direct IP Address Host (${finalHost})`,
      titleAr: `الرابط يستخدم عنوان IP مباشر (${finalHost})`,
      detailEn: 'Legitimate services rarely direct users to raw IP addresses instead of a registered domain.',
      detailAr: 'المواقع والجهات الموثوقة ما تستخدم عنوان IP مباشر بدال اسم نطاق رسمي.',
    });
  }

  if (suspiciousTld) {
    flags.push({
      code: 'SUSPICIOUS_TLD',
      severity: 'medium',
      category: 'domain',
      titleEn: `High-Abuse Top-Level Domain (.${tld})`,
      titleAr: `امتداد نطاق عالي الخطورة (.${tld})`,
      detailEn: `The .${tld} TLD is heavily abused in disposable phishing and scam campaigns.`,
      detailAr: `الامتداد (.${tld}) يُستخدم بكثرة في حملات التصيّد والروابط الوهمية المؤقتة.`,
    });
  }

  if (excessiveSubdomains) {
    flags.push({
      code: 'EXCESSIVE_SUBDOMAINS',
      severity: 'medium',
      category: 'domain',
      titleEn: `Excessive Subdomain Depth (${subdomainDepth} levels)`,
      titleAr: `تفرّع مبالغ فيه في النطاقات الفرعية (${subdomainDepth} مستويات)`,
      detailEn: `Hostname "${finalHost}" chains ${subdomainDepth} subdomain levels, often used to push the true domain out of view.`,
      detailAr: `اسم النطاق "${finalHost}" يحتوي على ${subdomainDepth} نطاقات فرعية متسلسلة، وغالباً تُستخدم لإخفاء النطاق الحقيقي.`,
    });
  }

  // TLS Flags
  if (!tls.isHttps) {
    flags.push({
      code: 'NO_HTTPS',
      severity: hasSensitiveInputs ? 'critical' : 'high',
      category: 'ssl',
      titleEn: 'Unencrypted HTTP Connection (No SSL/TLS)',
      titleAr: 'اتصال غير مشفر (بدون شهادة أمان HTTPS)',
      detailEn: hasSensitiveInputs
        ? 'This page collects sensitive credentials or payment information over unencrypted HTTP.'
        : 'Traffic to this site is unencrypted over plain HTTP.',
      detailAr: hasSensitiveInputs
        ? 'الصفحة تطلب كلمات سر أو بيانات دفع عبر اتصال HTTP غير مشفر نهائياً!'
        : 'الاتصال بهذا الموقع غير مشفر ويفتقد شهادة HTTPS.',
    });
  } else if (tls.checked && !tls.valid) {
    const reasons: string[] = [];
    if (tls.selfSigned) reasons.push('self-signed certificate');
    if (tls.expired) reasons.push('expired certificate');
    if (tls.notYetValid) reasons.push('certificate not yet valid');
    if (tls.hostnameMismatch) reasons.push('hostname mismatch');
    if (reasons.length === 0 && tls.authorizationError) reasons.push(tls.authorizationError);

    flags.push({
      code: 'INVALID_TLS_CERT',
      severity: hasSensitiveInputs ? 'critical' : 'high',
      category: 'ssl',
      titleEn: `Invalid SSL/TLS Certificate (${reasons.join(', ')})`,
      titleAr: `شهادة أمان SSL غير صالحة (${reasons.join('، ')})`,
      detailEn: `TLS certificate verification failed: ${reasons.join(', ')}.`,
      detailAr: `فشل التحقق من شهادة الأمان للموقع للأسباب التالية: ${reasons.join('، ')}.`,
    });
  }

  // Domain Age Flags
  if (registration.isNewlyRegistered && registration.domainAgeDays !== null) {
    flags.push({
      code: 'NEWLY_REGISTERED_DOMAIN',
      severity: 'high',
      category: 'domain',
      titleEn: `Newly Registered Domain (${registration.domainAgeDays} days old)`,
      titleAr: `نطاق مسجّل حديثاً (عمره ${registration.domainAgeDays} يوم بس)`,
      detailEn: `Domain "${registration.registrableDomain}" was created on ${registration.createdAt?.slice(0, 10)}. Newly registered domains carry high scam risk.`,
      detailAr: `تم تسجيل النطاق "${registration.registrableDomain}" بتاريخ ${registration.createdAt?.slice(0, 10)}. النطاقات الجديدة جداً غالباً تُستخدم في الاحتيال السريع.`,
    });
  } else if (registration.isYoungDomain && registration.domainAgeDays !== null) {
    flags.push({
      code: 'YOUNG_DOMAIN',
      severity: 'medium',
      category: 'domain',
      titleEn: `Young Domain (${registration.domainAgeDays} days old)`,
      titleAr: `نطاق حديث التسجيل (عمره ${registration.domainAgeDays} يوم)`,
      detailEn: `Domain "${registration.registrableDomain}" is less than 90 days old.`,
      detailAr: `عمر النطاق "${registration.registrableDomain}" أقل من 90 يوم، يفضل التأكد الإضافي قبل التعامل معه.`,
    });
  }

  if (registration.statuses.some((s) => /hold/i.test(s))) {
    flags.push({
      code: 'DOMAIN_ON_HOLD',
      severity: 'high',
      category: 'domain',
      titleEn: 'Domain Has Hold / Suspension Status',
      titleAr: 'النطاق عليه حالة إيقاف أو تعليق (Hold)',
      detailEn: `Registry status flags include: ${registration.statuses.join(', ')}.`,
      detailAr: `سجل النطاق يظهر حالات تعليق أو إيقاف: ${registration.statuses.join(', ')}.`,
    });
  }

  // Form Credential Harvesting & Phishing Kit Flags
  if (hasSensitiveInputs && browser.externalFormActions.length > 0) {
    flags.push({
      code: 'EXTERNAL_CREDENTIAL_HARVESTING',
      severity: 'critical',
      category: 'credential_harvesting',
      titleEn: 'Sensitive Form Submits Data to Unrelated Third-Party Domain',
      titleAr: 'نموذج يرسل بياناتك الحساسة لنطاق خارجي غريب!',
      detailEn: `Page collects password/OTP/payment details and submits to external domain(s): ${browser.externalFormActions.join(', ')}.`,
      detailAr: `الصفحة تطلب كلمة سر أو رمز تحقق أو بطاقة دفع وترسلها مباشرةً لنطاق خارجي غير مرتبط بالموقع: ${browser.externalFormActions.join(', ')}.`,
    });
  }

  if (browser.exfiltrationEndpoints.length > 0) {
    flags.push({
      code: 'EXFILTRATION_ENDPOINT_DETECTED',
      severity: 'critical',
      category: 'phishing_kit',
      titleEn: 'Phishing-Kit Data Exfiltration Endpoint Found in Page Script',
      titleAr: 'تم رصد قناة سرقة بيانات (Phishing Kit) داخل كود الصفحة!',
      detailEn: `Detected suspicious exfiltration channel: ${browser.exfiltrationEndpoints.join('; ')}.`,
      detailAr: `تم اكتشاف كود يرسل البيانات لقناة خارجية مشبوهة: ${browser.exfiltrationEndpoints.join('؛ ')}.`,
    });
  }

  if (browser.obfuscatedScriptIndicators.length > 0) {
    flags.push({
      code: 'OBFUSCATED_SCRIPTS',
      severity: 'medium',
      category: 'phishing_kit',
      titleEn: 'Obfuscated JavaScript Detected',
      titleAr: 'تم رصد أكواد جافاسكربت مموّهة أو مشفرة',
      detailEn: browser.obfuscatedScriptIndicators.join('; '),
      detailAr: `الصفحة تحتوي على أكواد مموّهة قد تُستخدم لإخفاء سلوك خبيث: ${browser.obfuscatedScriptIndicators.join('؛ ')}.`,
    });
  }

  // DNS / Email Auth note (informational/low unless combined with job scam)
  if (registrableDomain && dns.mxRecords.length === 0 && !dns.hasSpf && !dns.hasDmarc) {
    flags.push({
      code: 'NO_EMAIL_INFRASTRUCTURE',
      severity: 'info',
      category: 'domain',
      titleEn: 'No Email / SPF / DMARC Records Configured',
      titleAr: 'لا توجد سجلات بريد إلكتروني (MX/SPF/DMARC) للنطاق',
      detailEn: `Domain "${registrableDomain}" has no MX, SPF, or DMARC DNS records configured.`,
      detailAr: `النطاق "${registrableDomain}" لا يملك سجلات بريد إلكتروني رسمية أو حماية SPF/DMARC.`,
    });
  }

  return {
    redirects,
    headers,
    domAndForms,
    anomalies,
    flags,
  };
}
