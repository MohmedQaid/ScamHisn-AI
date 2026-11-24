import {
  SEVERITY_ORDER,
  VERDICT_THRESHOLDS,
  type AiForensicAnalysis,
  type BilingualFlag,
  type PromptInjectionReport,
  type ScanMode,
  type TechnicalChecks,
  type VerdictLevel,
} from '@scamhisn/shared';

export interface ScoringInput {
  mode: ScanMode;
  technicalChecks: TechnicalChecks;
  heuristicFlags: BilingualFlag[];
  promptInjection: PromptInjectionReport;
  aiAnalysis: AiForensicAnalysis;
}

export interface ScoringResult {
  scamScore: number;
  verdict: VerdictLevel;
  scoreBreakdown: {
    deterministicRiskPoints: number;
    aiScamScore: number | null;
    appliedFloor: number | null;
    escalationReason: string | null;
  };
  smokingGunsTriggered: BilingualFlag[];
  redFlags: BilingualFlag[];
}

export function scoreToVerdict(score: number): VerdictLevel {
  if (score >= VERDICT_THRESHOLDS.CONFIRMED_SCAM_MIN) return 'confirmed_scam';
  if (score > VERDICT_THRESHOLDS.SUSPICIOUS_MAX) return 'high_risk';
  if (score > VERDICT_THRESHOLDS.CAUTION_MAX) return 'suspicious';
  if (score > VERDICT_THRESHOLDS.SAFE_MAX) return 'caution';
  return 'safe';
}

/**
 * Decisive hybrid 0–100% scam scoring engine.
 * Guarantees that fatal smoking guns immediately escalate to 95–100% (Confirmed Scam)
 * without being diluted by naive averaging against neutral/passing signals (such as valid SSL).
 */
export function computeDecisiveScore(input: ScoringInput): ScoringResult {
  const { mode, technicalChecks, heuristicFlags, promptInjection, aiAnalysis } = input;
  const { tls, domainRegistration, redirects, headers, dns, domAndForms, anomalies } = technicalChecks;

  const smokingGuns: BilingualFlag[] = [];
  const compoundFlags: BilingualFlag[] = [];
  let appliedFloor: number | null = null;
  let escalationReason: string | null = null;

  const raiseFloor = (floor: number, reason: string) => {
    if (appliedFloor === null || floor > appliedFloor) {
      appliedFloor = floor;
      escalationReason = reason;
    }
  };

  // =========================================================================
  // 1. FATAL SMOKING GUNS — Immediate 95–100% Confirmed Scam Escalation
  // =========================================================================

  // Smoking Gun A: Sensitive form submits credentials/OTP/payment to an unrelated domain
  if (domAndForms.hasSensitiveInputs && domAndForms.externalFormActions.length > 0) {
    smokingGuns.push({
      code: 'SMOKING_GUN_EXTERNAL_CREDENTIAL_HARVEST',
      severity: 'critical',
      category: 'credential_harvesting',
      titleEn: 'Active Credential Harvesting to Unrelated Third-Party Domain',
      titleAr: 'سرقة بيانات نشطة — النموذج يرسل معلوماتك لنطاق خارجي!',
      detailEn: `Login, OTP, or payment inputs submit directly to external host(s): ${domAndForms.externalFormActions.join(', ')}.`,
      detailAr: `الصفحة تطلب كلمة سر أو رمز تحقق أو بطاقة دفع وترسلها مباشرةً لموقع خارجي غريب: ${domAndForms.externalFormActions.join(', ')}.`,
    });
    raiseFloor(100, 'Active credential/payment harvesting to unrelated domain');
  }

  // Smoking Gun B: Direct phishing-kit exfiltration endpoint (Telegram bot / Discord webhook)
  if (domAndForms.exfiltrationEndpoints.length > 0) {
    smokingGuns.push({
      code: 'SMOKING_GUN_PHISHING_KIT_EXFILTRATION',
      severity: 'critical',
      category: 'phishing_kit',
      titleEn: 'Confirmed Phishing-Kit Exfiltration Endpoint Detected',
      titleAr: 'كشف قناة تهريب بيانات احتيالية (Phishing Kit) مؤكدة!',
      detailEn: `Page scripts embed direct exfiltration channel: ${domAndForms.exfiltrationEndpoints.join('; ')}.`,
      detailAr: `كود الصفحة يحتوي على قناة تهريب بيانات مسروقة مباشرةً: ${domAndForms.exfiltrationEndpoints.join('؛ ')}.`,
    });
    raiseFloor(100, 'Phishing-kit exfiltration endpoint detected');
  }

  // Smoking Gun C: Self-signed, expired, not-yet-valid, or mismatched SSL on login/payment page
  const hasBrokenSsl =
    tls.isHttps &&
    tls.checked &&
    (tls.selfSigned || tls.expired || tls.notYetValid || tls.hostnameMismatch || !tls.valid);

  if (hasBrokenSsl && domAndForms.hasSensitiveInputs) {
    smokingGuns.push({
      code: 'SMOKING_GUN_BROKEN_SSL_SENSITIVE_FORM',
      severity: 'critical',
      category: 'ssl',
      titleEn: 'Invalid/Self-Signed SSL Certificate on Login or Payment Page',
      titleAr: 'شهادة SSL منتهية أو مزوّرة على صفحة تسجيل دخول أو دفع!',
      detailEn: `This page requests sensitive credentials/payment data while presenting an invalid TLS certificate (${tls.authorizationError ?? 'verification failed'}).`,
      detailAr: `الصفحة تطلب بيانات دخول أو دفع حساسة بينما شهادة الأمان غير صالحة أو مزوّرة (${tls.authorizationError ?? 'فشل التحقق'}).`,
    });
    raiseFloor(98, 'Invalid/self-signed/expired SSL certificate on login/payment page');
  }

  // Smoking Gun D: Plain HTTP (no encryption) on login/OTP/payment page
  if (!tls.isHttps && domAndForms.hasSensitiveInputs) {
    smokingGuns.push({
      code: 'SMOKING_GUN_HTTP_SENSITIVE_FORM',
      severity: 'critical',
      category: 'ssl',
      titleEn: 'Unencrypted Plain HTTP Login or Payment Form',
      titleAr: 'طلب كلمات سر أو بيانات بطاقة على رابط HTTP غير مشفر!',
      detailEn: 'Sensitive credentials or card inputs are served over unencrypted HTTP without SSL/TLS.',
      detailAr: 'الصفحة تطلب بيانات حساسة عبر رابط HTTP بدون أي تشفير أو شهادة أمان.',
    });
    raiseFloor(96, 'Unencrypted HTTP page collecting sensitive credentials or payment data');
  }

  // Smoking Gun E: Brand/Government Impersonation paired with sensitive inputs
  if (anomalies.impersonatedBrand && domAndForms.hasSensitiveInputs) {
    smokingGuns.push({
      code: 'SMOKING_GUN_BRAND_IMPERSONATION_PHISHING',
      severity: 'critical',
      category: 'impersonation',
      titleEn: `Active Phishing Impersonating ${anomalies.impersonatedBrand}`,
      titleAr: `تصيّد احتيالي نشط ينتحل هوية ${anomalies.impersonatedBrand}!`,
      detailEn: `Unofficial domain impersonates ${anomalies.impersonatedBrand} while collecting sensitive login/payment/ID details.`,
      detailAr: `نطاق غير رسمي ينتحل اسم ${anomalies.impersonatedBrand} ويطلب بيانات دخول أو دفع أو هوية.`,
    });
    raiseFloor(99, `Brand impersonation (${anomalies.impersonatedBrand}) with credential harvesting`);
  }

  // Smoking Gun F: Mixed-script IDN homograph spoofing
  if (anomalies.hasMixedScriptHomograph) {
    smokingGuns.push({
      code: 'SMOKING_GUN_IDN_HOMOGRAPH',
      severity: 'critical',
      category: 'impersonation',
      titleEn: 'Confirmed IDN Homograph Lookalike Domain Attack',
      titleAr: 'هجوم تزوير نطاق مؤكد بأحرف متشابهة (IDN Homograph)!',
      detailEn: `Punycode domain "${anomalies.unicodeDomain}" mixes Unicode scripts to visually mimic a trusted domain.`,
      detailAr: `النطاق "${anomalies.unicodeDomain}" يخلط بين أبجديات متشابهة شكلياً لخداع الضحايا.`,
    });
    raiseFloor(domAndForms.hasSensitiveInputs ? 100 : 95, 'Confirmed IDN homograph spoofing attack');
  }

  // Smoking Gun G: Embedded Prompt-Injection Attack (Local deterministic critical OR AI-detected)
  const isCriticalLocalPromptInjection =
    promptInjection.detected &&
    (promptInjection.severity === 'critical' ||
      promptInjection.hiddenDomInjectionDetected ||
      promptInjection.reviewInjectionDetected ||
      promptInjection.unicodeTagSmugglingDetected);

  if (isCriticalLocalPromptInjection || aiAnalysis.aiDetectedPromptInjection) {
    const channels = Array.from(new Set(promptInjection.findings.map((f) => f.channel)));
    const channelText = channels.length > 0 ? channels.join(', ') : 'page content';
    const isStealth =
      promptInjection.hiddenDomInjectionDetected ||
      promptInjection.reviewInjectionDetected ||
      promptInjection.unicodeTagSmugglingDetected;

    smokingGuns.push({
      code: 'SMOKING_GUN_PROMPT_INJECTION_ATTACK',
      severity: 'critical',
      category: 'prompt_injection',
      titleEn: 'Embedded Prompt-Injection Attack Targeting AI Security Inspectors',
      titleAr: 'هجوم حقن أوامر (Prompt Injection) لمحاولة خداع نظام الفحص!',
      detailEn:
        aiAnalysis.promptInjectionEvidence ||
        `Malicious AI-manipulation instructions detected in ${channelText} attempting to hijack the scam verdict.`,
      detailAr: `تم رصد أوامر خبيثة مخفية في (${channelText}) تحاول خداع الذكاء الاصطناعي وتغيير نتيجة الفحص لـ "آمن"!`,
    });
    raiseFloor(isStealth ? 100 : 98, 'Embedded prompt-injection attack detected');
  }

  // Smoking Gun H: Newly registered domain (<30 days) + sensitive form + high-abuse TLD
  if (
    domainRegistration.isNewlyRegistered &&
    domAndForms.hasSensitiveInputs &&
    anomalies.suspiciousTld
  ) {
    smokingGuns.push({
      code: 'SMOKING_GUN_DISPOSABLE_PHISHING_DOMAIN',
      severity: 'critical',
      category: 'domain',
      titleEn: 'Newly Registered High-Abuse Domain Collecting Credentials',
      titleAr: 'نطاق جديد ومشبوه يطلب كلمات سر أو بيانات دفع!',
      detailEn: `Domain is only ${domainRegistration.domainAgeDays} days old on a high-abuse .${anomalies.tld} TLD and collects sensitive user credentials.`,
      detailAr: `النطاق عمره ${domainRegistration.domainAgeDays} يوم فقط على امتداد مشبوه (.${anomalies.tld}) ويطلب بيانات حساسة.`,
    });
    raiseFloor(96, 'Newly registered high-abuse domain collecting credentials');
  }

  // Smoking Gun I: AI high-confidence confirmed phishing/scam or provably false official claim
  if (
    aiAnalysis.status !== 'unavailable' &&
    aiAnalysis.confidence === 'high' &&
    (aiAnalysis.confirmedPhishingOrScam || aiAnalysis.provablyFalseOrImpersonatedClaim)
  ) {
    smokingGuns.push({
      code: 'SMOKING_GUN_AI_CONFIRMED_SCAM',
      severity: 'critical',
      category: 'ai_forensics',
      titleEn: aiAnalysis.impersonatedEntity
        ? `Confirmed Scam / Impersonation of ${aiAnalysis.impersonatedEntity}`
        : 'Confirmed Fraudulent Claim or Phishing Operation',
      titleAr: aiAnalysis.impersonatedEntity
        ? `احتيال مؤكد وانتحال هوية ${aiAnalysis.impersonatedEntity}`
        : 'احتيال مؤكد أو ادعاء رسمي مزوّر',
      detailEn: aiAnalysis.summaryEn,
      detailAr: aiAnalysis.summaryAr,
    });
    raiseFloor(Math.max(95, aiAnalysis.aiScamScore ?? 95), 'AI confirmed phishing/scam or provably false official claim');
  }

  // Smoking Gun J: Map mode verified review injection / scam links with detected injection
  if (
    mode === 'map' &&
    aiAnalysis.mapAnalysis?.reviewInjectionOrScamLinksFound &&
    (promptInjection.detected || aiAnalysis.aiDetectedPromptInjection)
  ) {
    raiseFloor(98, 'Malicious prompt injection / scam payload embedded in map listing reviews');
  }

  // Multiple simultaneous smoking guns always saturate to 100%
  if (smokingGuns.length >= 2) {
    raiseFloor(100, 'Multiple independent fatal smoking guns triggered');
  }

  // =========================================================================
  // 2. HIGH-RISK FLOORS (75–94%) — Strong indicators without fatal confirmation
  // =========================================================================

  if (promptInjection.detected && appliedFloor === null) {
    raiseFloor(86, 'Suspicious prompt-injection pattern detected in page text');
  }

  if (anomalies.impersonatedBrand && (appliedFloor === null || appliedFloor < 84)) {
    raiseFloor(84, `Unofficial domain impersonating ${anomalies.impersonatedBrand}`);
  }

  if (hasBrokenSsl && (appliedFloor === null || appliedFloor < 78)) {
    raiseFloor(78, 'Invalid, self-signed, expired, or hostname-mismatched SSL certificate');
  }

  if (
    domainRegistration.isNewlyRegistered &&
    (anomalies.suspiciousTld ||
      domAndForms.obfuscatedScriptIndicators.length > 0 ||
      domAndForms.hasSensitiveInputs) &&
    (appliedFloor === null || appliedFloor < 85)
  ) {
    raiseFloor(85, 'Newly registered domain combined with suspicious TLD, obfuscation, or forms');
  }

  // Compound Throwaway-Scam Infrastructure Pattern (High strictness, low false positives):
  // Established legit sites are never newly registered (<30d), and legit startups usually configure
  // either email (MX/SPF/DMARC) or basic HTTP security headers. Missing ALL THREE simultaneously
  // is a strong disposable scam / fake-storefront fingerprint.
  const hasNoEmailInfrastructure = Boolean(
    domainRegistration.registrableDomain &&
      dns.mxRecords.length === 0 &&
      !dns.hasSpf &&
      !dns.hasDmarc,
  );
  const missingAllCoreHeaders =
    domAndForms.browserCaptured && headers.missingCriticalHeaders.length === 3;

  if (domainRegistration.isNewlyRegistered && hasNoEmailInfrastructure && missingAllCoreHeaders) {
    const isUltraFresh =
      domainRegistration.domainAgeDays !== null && domainRegistration.domainAgeDays <= 14;
    const floor = isUltraFresh ? 76 : 68;
    compoundFlags.push({
      code: 'THROWAWAY_SCAM_INFRASTRUCTURE',
      severity: 'high',
      category: 'domain',
      titleEn: 'Disposable Unconfigured New Website Pattern',
      titleAr: 'نمط موقع جديد ومؤقت بدون أي إعدادات أمان أو بريد',
      detailEn: `Domain is only ${domainRegistration.domainAgeDays ?? '<30'} days old with zero email/SPF/DMARC records and all core HTTP security headers missing—a strong indicator of a throwaway scam or clone storefront.`,
      detailAr: `النطاق عمره ${domainRegistration.domainAgeDays ?? 'أقل من 30'} يوم فقط ولا يملك أي سجلات بريد (MX/SPF/DMARC) ويفتقد جميع ترويسات الحماية الأساسية، وهو نمط شائع جداً في مواقع الاحتيال والمتاجر المقلّدة المؤقتة.`,
    });
    if (appliedFloor === null || appliedFloor < floor) {
      raiseFloor(
        floor,
        'Newly registered domain with no email/DNS auth and missing all core HTTP security headers',
      );
    }
  }

  if (mode === 'job' && aiAnalysis.jobAnalysis) {
    const auth = aiAnalysis.jobAnalysis.jobAuthenticityScore;
    if (auth <= 10) {
      raiseFloor(95, 'Confirmed fraudulent job listing (authenticity <= 10%)');
    } else if (auth <= 25 || (!aiAnalysis.jobAnalysis.linkLegitimate && auth <= 40)) {
      raiseFloor(85, 'High-risk recruitment / fake employer scam indicators');
    }
  }

  if (mode === 'map' && aiAnalysis.mapAnalysis) {
    if (aiAnalysis.mapAnalysis.contactHijackingSuspected) {
      raiseFloor(86, 'Suspected contact number hijacking on map business listing');
    } else if (aiAnalysis.mapAnalysis.reviewInjectionOrScamLinksFound) {
      raiseFloor(80, 'Scam links or manipulative content detected in map reviews');
    } else if (!aiAnalysis.mapAnalysis.businessExistsOnExternalSources && !aiAnalysis.mapAnalysis.placeVerified) {
      raiseFloor(72, 'Listed map business could not be verified on external sources');
    }
  }

  // =========================================================================
  // 3. DETERMINISTIC TECHNICAL RISK POINTS (Additive, Non-Dilutive)
  // =========================================================================
  let techPoints = 0;

  if (!tls.isHttps) techPoints += 28;
  else if (hasBrokenSsl) techPoints += 42;

  if (domainRegistration.isNewlyRegistered) techPoints += 30;
  else if (domainRegistration.isYoungDomain) techPoints += 14;
  if (domainRegistration.statuses.some((s) => /hold/i.test(s))) techPoints += 25;

  if (anomalies.isPunycode) techPoints += 16;
  if (anomalies.hasMixedScriptHomograph) techPoints += 50;
  if (anomalies.suspiciousTld) techPoints += 16;
  if (anomalies.excessiveSubdomains) techPoints += 14;
  if (anomalies.usesRawIp) techPoints += 28;
  if (anomalies.hasEmbeddedCredentials) techPoints += 32;
  if (anomalies.isUrlShortener && redirects.crossDomainRedirect) techPoints += 10;
  if (anomalies.impersonatedBrand) techPoints += 45;

  if (redirects.maxHopsExceeded || redirects.hopCount >= 4) techPoints += 18;
  else if (redirects.crossDomainRedirect) techPoints += 6;

  if (domAndForms.browserCaptured && headers.missingCriticalHeaders.length === 3) {
    techPoints += 6;
  }
  if (domainRegistration.isNewlyRegistered && hasNoEmailInfrastructure) {
    techPoints += 18;
  } else if (domainRegistration.isYoungDomain && hasNoEmailInfrastructure && missingAllCoreHeaders) {
    techPoints += 14;
  }

  if (domAndForms.obfuscatedScriptIndicators.length > 0) techPoints += 18;
  if (domAndForms.hasSensitiveInputs && domainRegistration.isYoungDomain) techPoints += 15;
  if (promptInjection.detected) techPoints += 45;

  const deterministicRiskPoints = Math.min(100, Math.round(techPoints));

  // =========================================================================
  // 4. NON-DILUTIVE HYBRID FUSION (Valid SSL never drags down a detected scam)
  // =========================================================================
  const aiScore = aiAnalysis.aiScamScore;
  let combinedScore: number;

  if (aiScore !== null) {
    // Max-biased fusion: the higher risk signal leads, with modest corroboration boost
    // when both technical checks and AI detect risk.
    const dominant = Math.max(deterministicRiskPoints, aiScore);
    const secondary = Math.min(deterministicRiskPoints, aiScore);
    const corroborationBoost = secondary >= 20 ? Math.round(secondary * 0.2) : 0;
    combinedScore = Math.min(100, dominant + corroborationBoost);
  } else {
    combinedScore = deterministicRiskPoints;
  }

  if (appliedFloor !== null) {
    combinedScore = Math.max(combinedScore, appliedFloor);
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(combinedScore)));
  const verdict = scoreToVerdict(finalScore);

  // =========================================================================
  // 5. MERGE, DEDUPLICATE & PRIORITIZE ALL RED FLAGS
  // =========================================================================
  const allFlags: BilingualFlag[] = [...smokingGuns, ...compoundFlags, ...heuristicFlags];

  if (promptInjection.detected) {
    for (const f of promptInjection.findings.slice(0, 4)) {
      allFlags.push({
        code: `PI_${f.patternName.toUpperCase()}`,
        severity: f.severity,
        category: 'prompt_injection',
        titleEn: `Prompt Injection Attempt in ${f.channel.replace(/_/g, ' ')}`,
        titleAr: `محاولة حقن أوامر ذكاء اصطناعي في (${f.channel.replace(/_/g, ' ')})`,
        detailEn: f.decodedPayload
          ? `${f.matchedExcerpt} | Decoded: "${f.decodedPayload}"`
          : `Matched: "${f.matchedExcerpt}"`,
        detailAr: f.decodedPayload
          ? `تم فك تشفير أمر مخفي: "${f.decodedPayload}"`
          : `النص المرصود: "${f.matchedExcerpt}"`,
      });
    }
  }

  for (let idx = 0; idx < aiAnalysis.keyFindings.length; idx++) {
    const kf = aiAnalysis.keyFindings[idx]!;
    allFlags.push({
      code: `AI_FINDING_${idx + 1}`,
      severity: kf.severity,
      category: mode === 'job' ? 'job_scam' : mode === 'map' ? 'map_scam' : 'ai_forensics',
      titleEn: kf.titleEn,
      titleAr: kf.titleAr,
      detailEn: kf.detailEn,
      detailAr: kf.detailAr,
    });
  }

  // Deduplicate by code + titleEn and sort critical -> info
  const seenFlags = new Set<string>();
  const dedupedFlags = allFlags
    .filter((f) => {
      const key = `${f.code}:${f.titleEn.toLowerCase()}`;
      if (seenFlags.has(key)) return false;
      seenFlags.add(key);
      return true;
    })
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  return {
    scamScore: finalScore,
    verdict,
    scoreBreakdown: {
      deterministicRiskPoints,
      aiScamScore: aiScore,
      appliedFloor,
      escalationReason,
    },
    smokingGunsTriggered: smokingGuns,
    redFlags: dedupedFlags,
  };
}
