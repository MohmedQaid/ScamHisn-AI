import type { Locale, ScanMode, VerdictLevel } from '@scamhisn/shared';

export interface Translations {
  brandName: string;
  brandSubtitle: string;
  heroTitle: string;
  modePrompt: string;
  modes: Record<
    ScanMode,
    {
      label: string;
      shortDesc: string;
      placeholder: string;
    }
  >;
  urlLabel: string;
  pasteBtn: string;
  scanBtn: string;
  scanningBtn: string;
  trySampleLabel: string;
  samples: Array<{ label: string; url: string; mode: ScanMode }>;
  progressTitle: string;
  progressSteps: string[];
  scamLikelihoodLabel: string;
  verdicts: Record<VerdictLevel, { label: string; desc: string }>;
  smokingGunTitle: string;
  promptInjectionTitle: string;
  promptInjectionSubtitle: string;
  groundingSourcesTitle: string;
  redFlagsTitle: string;
  noRedFlagsText: string;
  technicalChecksTitle: string;
  cards: {
    sslTitle: string;
    domainTitle: string;
    redirectTitle: string;
    headersDnsTitle: string;
    domFormsTitle: string;
    injectionShieldTitle: string;
  };
  actions: {
    showDetails: string;
    hideDetails: string;
    generateReport: string;
    generatingReport: string;
    sendToPolice: string;
    conceptBadge: string;
    policeConceptNotice: string;
    reportError: string;
  };
  labels: {
    finalDestination: string;
    valid: string;
    invalid: string;
    noHttps: string;
    issuer: string;
    expiresIn: string;
    days: string;
    selfSigned: string;
    expired: string;
    mismatch: string;
    domainAge: string;
    registrar: string;
    created: string;
    unavailable: string;
    newlyRegistered: string;
    hops: string;
    crossDomain: string;
    sameDomain: string;
    httpStatus: string;
    sensitiveForms: string;
    yes: string;
    no: string;
    externalFormPost: string;
    hiddenElements: string;
    impersonatedBrand: string;
    punycodeHomograph: string;
    cleanShield: string;
    attackDetected: string;
    channelsDetected: string;
    zeroWidthChars: string;
    jobAuthenticityTitle: string;
    jobConfidenceLabel: string;
    linkLegitimacyLabel: string;
    companyVerificationLabel: string;
    legitimate: string;
    suspiciousOrFake: string;
    verified: string;
    unverified: string;
    mapVerificationTitle: string;
    placeExistsLabel: string;
    contactHijackLabel: string;
    reviewAuditLabel: string;
    coordinatesLabel: string;
    clean: string;
    flagged: string;
    rawMetadataTitle: string;
    copyJson: string;
    copiedJson: string;
  };
  footer: {
    teamTitle: string;
    teamName: string;
    membersLabel: string;
    notesTitle: string;
    apiNoteLabel: string;
    apiNoteDesc: string;
    sandboxNote: string;
    privacyNote: string;
    downloadExtensionBtn: string;
    extensionDesktopOnly: string;
    extensionBriefSteps: string;
  };
  severity: Record<'critical' | 'high' | 'medium' | 'low' | 'info', string>;
}

export const TEAM_MEMBERS = [
  'Mohammed Ahmed Abdulnoor',
  'Abdulrhman Ahmed Drizi',
  'Khalid Ahmed Al Khawaldah',
  'Ahmed Al Hashmi',
  'Yousef Mohammed',
] as const;

export const TRANSLATIONS: Record<Locale, Translations> = {
  en: {
    brandName: 'ScamHisn AI',
    brandSubtitle: 'Digital Fraud Inspector',
    heroTitle: 'Inspect Any Link Before You Click',
    modePrompt: 'Link Type',
    modes: {
      general: {
        label: 'General Link',
        shortDesc: 'Phishing & brand spoofing',
        placeholder: 'Paste any suspicious link... e.g. https://example.com/verify',
      },
      job: {
        label: 'Job Post',
        shortDesc: 'Fake employers & job fees',
        placeholder: 'Paste a job posting URL... e.g. https://careers.company.com/role',
      },
      map: {
        label: 'Map Link',
        shortDesc: 'Fake places & review attacks',
        placeholder: 'Paste a Google Maps or location link... e.g. https://maps.app.goo.gl/...',
      },
    },
    urlLabel: 'Target URL',
    pasteBtn: 'Paste',
    scanBtn: 'Inspect Link',
    scanningBtn: 'Inspecting...',
    trySampleLabel: 'Quick test:',
    samples: [
      { label: 'UAE Portal (u.ae)', url: 'https://u.ae/en', mode: 'general' },
      { label: 'Example.com', url: 'https://example.com', mode: 'general' },
    ],
    progressTitle: 'Running Isolated Forensic Pipeline',
    progressSteps: [
      'Validating URL & blocking SSRF private IP ranges',
      'Rendering inside ephemeral Playwright Chromium headless shell',
      'Inspecting SSL/TLS certificate, RDAP domain age & DNS auth',
      'Scanning hidden DOM & reviews for prompt-injection attacks',
      'Running AI grounded verification & hybrid risk scoring',
    ],
    scamLikelihoodLabel: 'Scam Likelihood',
    verdicts: {
      safe: {
        label: 'Likely Safe',
        desc: 'No significant phishing, impersonation, or technical scam indicators were found.',
      },
      caution: {
        label: 'Proceed with Caution',
        desc: 'Minor anomalies or unverified details detected. Double-check before sharing data.',
      },
      suspicious: {
        label: 'Suspicious',
        desc: 'Multiple warning signals detected. Avoid entering credentials or payment details.',
      },
      high_risk: {
        label: 'High Scam Risk',
        desc: 'Strong evidence of deception, impersonation, or unsafe technical indicators.',
      },
      confirmed_scam: {
        label: 'Confirmed Scam',
        desc: 'Fatal smoking-gun evidence detected. Do NOT interact with or trust this link.',
      },
    },
    smokingGunTitle: 'Fatal Smoking-Gun Triggers (Auto-Escalated to 95–100%)',
    promptInjectionTitle: 'Prompt-Injection Attack Intercepted!',
    promptInjectionSubtitle:
      'Hostile instructions attempting to manipulate AI security scanners were embedded in this link.',
    groundingSourcesTitle: 'Verified Grounding Sources (Google Search & Maps)',
    redFlagsTitle: 'Detected Findings & Red Flags',
    noRedFlagsText: 'No red flags or critical anomalies were triggered on this link.',
    technicalChecksTitle: 'Technical Security Forensics',
    cards: {
      sslTitle: 'SSL / TLS Certificate',
      domainTitle: 'Domain Age & Registration',
      redirectTitle: 'Redirects & Destination',
      headersDnsTitle: 'Security Headers & DNS',
      domFormsTitle: 'DOM, Forms & Anomalies',
      injectionShieldTitle: 'Prompt-Injection Shield',
    },
    actions: {
      showDetails: 'Show Details',
      hideDetails: 'Hide Details',
      generateReport: 'Generate Report',
      generatingReport: 'Generating PDF...',
      sendToPolice: 'Send to police for investigation',
      conceptBadge: 'Concept',
      policeConceptNotice:
        'Concept preview: Direct law-enforcement submission is not connected to an active police API yet. You can download the full forensic PDF using "Generate Report" and attach it to your official eCrime report.',
      reportError: 'Could not generate the PDF report. Please try again.',
    },
    labels: {
      finalDestination: 'Final Destination',
      valid: 'Valid & Trusted',
      invalid: 'Invalid / Untrusted',
      noHttps: 'No HTTPS (Plain HTTP)',
      issuer: 'Issuer',
      expiresIn: 'Expires in',
      days: 'days',
      selfSigned: 'Self-Signed',
      expired: 'Expired',
      mismatch: 'Hostname Mismatch',
      domainAge: 'Domain Age',
      registrar: 'Registrar',
      created: 'Created',
      unavailable: 'Unavailable',
      newlyRegistered: 'Newly Registered (<30d)',
      hops: 'Redirect Hops',
      crossDomain: 'Cross-Domain Redirect',
      sameDomain: 'Same Domain',
      httpStatus: 'HTTP Status',
      sensitiveForms: 'Sensitive Inputs (Pass/OTP/Card)',
      yes: 'Yes',
      no: 'No',
      externalFormPost: 'External Form Action',
      hiddenElements: 'Hidden DOM Nodes',
      impersonatedBrand: 'Impersonated Brand',
      punycodeHomograph: 'IDN Homograph Spoof',
      cleanShield: 'No Injection Detected',
      attackDetected: 'Attack Intercepted',
      channelsDetected: 'Channels',
      zeroWidthChars: 'Zero-Width Chars',
      jobAuthenticityTitle: 'Job Post Authenticity Breakdown',
      jobConfidenceLabel: 'Job Authenticity Confidence',
      linkLegitimacyLabel: 'Link & Domain',
      companyVerificationLabel: 'Company Verification',
      legitimate: 'Legitimate',
      suspiciousOrFake: 'Suspicious / Unofficial',
      verified: 'Verified',
      unverified: 'Unverified',
      mapVerificationTitle: 'Map & Location Authenticity Audit',
      placeExistsLabel: 'External Place Verification',
      contactHijackLabel: 'Contact Hijacking Check',
      reviewAuditLabel: 'Reviews & Links Audit',
      coordinatesLabel: 'Parsed Coordinates',
      clean: 'Clean',
      flagged: 'Flagged',
      rawMetadataTitle: 'Raw Technical Metadata (API v1 JSON)',
      copyJson: 'Copy JSON',
      copiedJson: 'Copied!',
    },
    footer: {
      teamTitle: 'Developed By',
      teamName: 'Team Cybersound',
      membersLabel: 'Team Members',
      notesTitle: 'Important Application Notes',
      apiNoteLabel: 'REST API v1 Ready',
      apiNoteDesc: 'Versioned endpoint ready for web clients and future browser extensions.',
      sandboxNote:
        'All inspected URLs are opened inside an isolated ephemeral headless browser with downloads, cookies, and internal network ranges strictly blocked.',
      privacyNote:
        'Automated scores are decision-support forensics—never enter passwords, OTP codes, or card details on unverified links.',
      downloadExtensionBtn: 'Download Chrome Extension (.zip)',
      extensionDesktopOnly: 'Desktop browsers only (Chrome, Edge, Brave, Arc)',
      extensionBriefSteps:
        'Unzip → open chrome://extensions (Developer mode ON) → click Load unpacked.',
    },
    severity: {
      critical: 'Critical',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      info: 'Info',
    },
  },

  ar: {
    brandName: 'حصن الاحتيال',
    brandSubtitle: 'فاحص الروابط والاحتيال الرقمي',
    heroTitle: 'افحص الرابط وتأكد قبل ما تضغط',
    modePrompt: 'شو نوع الرابط؟',
    modes: {
      general: {
        label: 'رابط عام',
        shortDesc: 'روابط مشبوهة وتصيّد',
        placeholder: 'الصق الرابط المشبوه هني... مثلاً https://example.com/verify',
      },
      job: {
        label: 'إعلان وظيفة',
        shortDesc: 'مصداقية الشركة والوظيفة',
        placeholder: 'الصق رابط إعلان الوظيفة هني... مثلاً https://careers.company.com/role',
      },
      map: {
        label: 'رابط خريطة',
        shortDesc: 'المكان والتقييمات المخترقة',
        placeholder: 'الصق رابط خرائط جوجل أو الموقع هني... مثلاً https://maps.app.goo.gl/...',
      },
    },
    urlLabel: 'الرابط المطلوب فحصه',
    pasteBtn: 'لصق',
    scanBtn: 'افحص الرابط الحين',
    scanningBtn: 'جاري الفحص...',
    trySampleLabel: 'جرّب رابط سريع:',
    samples: [
      { label: 'حكومة الإمارات (u.ae)', url: 'https://u.ae/ar', mode: 'general' },
      { label: 'Example.com', url: 'https://example.com', mode: 'general' },
    ],
    progressTitle: 'جاري تشغيل منظومة الفحص المعزول',
    progressSteps: [
      'التحقق من سلامة الرابط وحظر العناوين الداخلية (SSRF)',
      'فتح الرابط داخل متصفح Chromium معزول بدون ملفات أو كوكيز',
      'فحص شهادة الأمان (SSL/TLS) وعمر النطاق (RDAP) وسجلات DNS',
      'تدقيق العناصر المخفية والتقييمات لكشف أي حقن أوامر',
      'تشغيل التحليل الذكي وحساب نسبة الاحتيال النهائية',
    ],
    scamLikelihoodLabel: 'نسبة الاحتيال',
    verdicts: {
      safe: {
        label: 'الرابط آمن',
        desc: 'ما رصدنا أي مؤشرات احتيال أو انتحال أو مخاطر تقنية واضحة على هذا الرابط.',
      },
      caution: {
        label: 'خلك حذر وتأكد أكثر',
        desc: 'في ملاحظات بسيطة أو تفاصيل غير موثّقة، تأكد زين قبل ما تشارك أي بيانات.',
      },
      suspicious: {
        label: 'رابط مشبوه — انتبه!',
        desc: 'رصدنا عدة علامات تحذيرية، لا تدخل كلمات سر أو بيانات بطاقة على هالصفحة.',
      },
      high_risk: {
        label: 'انتبه! احتمال احتيال عالي',
        desc: 'في أدلة قوية على تضليل أو انتحال هوية أو مؤشرات تقنية خطيرة جداً.',
      },
      confirmed_scam: {
        label: 'احتيال مؤكد',
        desc: 'تم كشف دليل قاطع على الاحتيال أو التلاعب! لا تضغط أي شي ولا تدخل بياناتك أبداً.',
      },
    },
    smokingGunTitle: 'أدلة قاطعة تم رصدها (تصعيد تلقائي إلى 95–100%)',
    promptInjectionTitle: 'تم إحباط هجوم حقن أوامر (Prompt Injection)!',
    promptInjectionSubtitle:
      'الموقع أو التقييمات تحتوي على أوامر مخفية تحاول خداع الذكاء الاصطناعي وتغيير النتيجة إلى "آمن".',
    groundingSourcesTitle: 'مصادر التحقق الموثّقة (بحث وخرائط جوجل)',
    redFlagsTitle: 'الملاحظات والتنبيهات المرصودة',
    noRedFlagsText: 'ما تم رصد أي علامات احتيال أو تنبيهات حرجة على هذا الرابط.',
    technicalChecksTitle: 'التفاصيل التقنية والأمنية',
    cards: {
      sslTitle: 'حالة شهادة الأمان (SSL/TLS)',
      domainTitle: 'عمر النطاق والتسجيل',
      redirectTitle: 'التحويلات والوجهة النهائية',
      headersDnsTitle: 'ترويسات الحماية و DNS',
      domFormsTitle: 'النماذج والعناصر المخفية',
      injectionShieldTitle: 'درع صد حقن الأوامر',
    },
    actions: {
      showDetails: 'عرض التفاصيل التقنية',
      hideDetails: 'إخفاء التفاصيل التقنية',
      generateReport: 'إنشاء تقرير (PDF)',
      generatingReport: 'جاري تجهيز التقرير...',
      sendToPolice: 'إرسال للشرطة للتحقيق',
      conceptBadge: 'نموذج تجريبي',
      policeConceptNotice:
        'ميزة تجريبية (Concept): الربط المباشر مع أنظمة الشرطة غير مفعّل حالياً. تقدر تحمّل التقرير الجنائي الكامل بصيغة PDF من زر "إنشاء تقرير (PDF)" وتقدمه مباشرةً للجهات المختصة.',
      reportError: 'تعذّر إنشاء تقرير الـ PDF حالياً. حاول مرة ثانية.',
    },
    labels: {
      finalDestination: 'الوجهة النهائية',
      valid: 'صالحة وموثوقة',
      invalid: 'غير صالحة / مشبوهة',
      noHttps: 'بدون تشفير (HTTP)',
      issuer: 'الجهة المصدّرة',
      expiresIn: 'تنتهي خلال',
      days: 'يوم',
      selfSigned: 'موقّعة ذاتياً',
      expired: 'منتهية الصلاحية',
      mismatch: 'عدم تطابق النطاق',
      domainAge: 'عمر النطاق',
      registrar: 'المسجّل',
      created: 'تاريخ التسجيل',
      unavailable: 'غير متوفر',
      newlyRegistered: 'مسجّل حديثاً (أقل من 30 يوم)',
      hops: 'عدد التحويلات',
      crossDomain: 'تحويل لنطاق مختلف',
      sameDomain: 'نفس النطاق',
      httpStatus: 'حالة الاستجابة',
      sensitiveForms: 'حقول حساسة (باسوورد/OTP/بطاقة)',
      yes: 'نعم',
      no: 'لا',
      externalFormPost: 'إرسال لنطاق خارجي',
      hiddenElements: 'عناصر DOM مخفية',
      impersonatedBrand: 'جهة منتحَلة',
      punycodeHomograph: 'تزوير أحرف متشابهة',
      cleanShield: 'سليم — لا يوجد حقن أوامر',
      attackDetected: 'تم رصد محاولة هجوم!',
      channelsDetected: 'القنوات المرصودة',
      zeroWidthChars: 'أحرف مخفية (Zero-Width)',
      jobAuthenticityTitle: 'تقييم مصداقية إعلان الوظيفة',
      jobConfidenceLabel: 'ثقة مصداقية الوظيفة',
      linkLegitimacyLabel: 'شرعية الرابط والنطاق',
      companyVerificationLabel: 'التحقق من الشركة',
      legitimate: 'رسمي وموثوق',
      suspiciousOrFake: 'مشبوه / غير رسمي',
      verified: 'شركة موثّقة',
      unverified: 'غير موثّقة',
      mapVerificationTitle: 'تدقيق مصداقية الموقع على الخريطة',
      placeExistsLabel: 'وجود المكان بمصادر خارجية',
      contactHijackLabel: 'فحص اختراق أرقام التواصل',
      reviewAuditLabel: 'تدقيق التقييمات والروابط',
      coordinatesLabel: 'الإحداثيات المرصودة',
      clean: 'سليم',
      flagged: 'تنبيه خطير',
      rawMetadataTitle: 'البيانات التقنية الكاملة (API v1 JSON)',
      copyJson: 'نسخ JSON',
      copiedJson: 'تم النسخ!',
    },
    footer: {
      teamTitle: 'تطوير فريق',
      teamName: 'Team Cybersound',
      membersLabel: 'أعضاء الفريق',
      notesTitle: 'ملاحظات مهمة حول التطبيق',
      apiNoteLabel: 'واجهة برمجية v1 جاهزة',
      apiNoteDesc: 'نقطة فحص برمجية موحّدة وجاهزة للربط مع تطبيقات الويب وإضافات المتصفح مستقبلاً.',
      sandboxNote:
        'يتم فتح جميع الروابط داخل متصفح معزول بالكامل مع منع التحميل والكوكيز وحظر الوصول للشبكات الداخلية.',
      privacyNote:
        'نتائج الفحص مساعدة تقنية للتحقق — لا تدخل أبداً كلمات السر أو رموز OTP أو بيانات البطاقة في صفحات غير موثّقة.',
      downloadExtensionBtn: 'تحميل إضافة كروم (.zip)',
      extensionDesktopOnly: 'لمتصفحات الحاسوب فقط (Chrome / Edge / Brave / Arc)',
      extensionBriefSteps:
        'فك الضغط ← افتح chrome://extensions (فعّل وضع المطوّر) ← اختر Load unpacked.',
    },
    severity: {
      critical: 'حرج',
      high: 'عالي',
      medium: 'متوسط',
      low: 'منخفض',
      info: 'معلومة',
    },
  },
};
