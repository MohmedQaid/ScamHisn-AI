/**
 * Smoke test for the self-hosted judge (Jais 2, Falcon-H1, or any OpenAI-compatible model).
 *
 *   LOCAL_LLM_BASE_URL=http://127.0.0.1:8080/v1 LOCAL_LLM_MODEL=<name> npx tsx eval/localModelSmoke.ts
 *
 * Sends realistic page content (Arabic and English scam lures plus genuine pages) through the
 * same connector the app uses, and prints the verdict, the time taken, and whether the reply was
 * valid JSON. It answers one question: is this model usable as the judge?
 * The cases are synthetic and few; this is a sanity check, not an accuracy benchmark.
 */
import { createLocalLlmProvider } from '../src/ai/localLlmProvider.js';
import type { AiAnalysisInput, ResearchNotes } from '../src/ai/types.js';

interface Case {
  name: string;
  expect: 'scam' | 'legit';
  url: string;
  title: string;
  text: string;
  impersonatedBrand?: string;
  sensitive?: boolean;
  ageDays?: number;
  research?: ResearchNotes;
}

const CASES: Case[] = [
  {
    name: 'AR fake traffic fine (police lure)',
    expect: 'scam',
    url: 'https://adpolice-fines-pay.top/verify',
    title: 'شرطة أبوظبي - دفع المخالفات',
    text: 'عزيزي العميل، لديك مخالفة مرورية غير مدفوعة بقيمة 150 درهماً. يجب السداد خلال 24 ساعة لتجنب الإحالة إلى المحكمة وحجز المركبة. أدخل رقم البطاقة وتاريخ الانتهاء ورمز CVV ثم رمز التحقق OTP المرسل إلى هاتفك.',
    impersonatedBrand: 'Abu Dhabi Police',
    sensitive: true,
    ageDays: 4,
  },
  {
    name: 'AR Emirati dialect parcel fee',
    expect: 'scam',
    url: 'https://emiratespost-ae.top/track',
    title: 'بريد الإمارات - تتبع الشحنة',
    text: 'هلا والله، شحنتك موقوفة عندنا في المستودع لأن العنوان ناقص. ادفع رسوم إعادة التوصيل 12.50 درهم الحين عشان نوصلها لك باجر. دخّل بيانات بطاقتك البنكية ورمز التحقق اللي يوصلك.',
    impersonatedBrand: 'Emirates Post',
    sensitive: true,
    ageDays: 9,
  },
  {
    name: 'AR UAE PASS login harvest',
    expect: 'scam',
    url: 'https://uaepass-login.verify-account.xyz/',
    title: 'الهوية الرقمية UAE PASS - تسجيل الدخول',
    text: 'تم إيقاف حسابك في الهوية الرقمية مؤقتاً. لإعادة التفعيل أدخل رقم الهوية الإماراتية وكلمة المرور ثم وافق على طلب التحقق في تطبيق UAE PASS فوراً.',
    impersonatedBrand: 'UAE PASS',
    sensitive: true,
    ageDays: 2,
  },
  {
    name: 'EN fake job with visa fee',
    expect: 'scam',
    url: 'https://adnoc-careers-hiring.com/apply',
    title: 'ADNOC Careers - Urgent Hiring 2026',
    text: 'Congratulations! You are shortlisted for Safety Officer at ADNOC, salary AED 18,000. No interview required. Pay the refundable visa processing fee of AED 750 via the link and send your passport copy and Emirates ID on WhatsApp +971 5X XXX XXXX to HR at adnoc.hr.recruit@gmail.com.',
    impersonatedBrand: 'ADNOC',
    sensitive: false,
    ageDays: 12,
  },
  {
    name: 'AR bank account suspended',
    expect: 'scam',
    url: 'https://fab-secure-login.com/update',
    title: 'بنك أبوظبي الأول - تحديث البيانات',
    text: 'عميلنا العزيز، تم تعليق بطاقتك لعدم تحديث بياناتك. حدّث بياناتك الآن لتجنب إيقاف الحساب نهائياً: رقم البطاقة، الرقم السري، ورمز OTP.',
    impersonatedBrand: 'First Abu Dhabi Bank (FAB)',
    sensitive: true,
    ageDays: 6,
  },
  {
    name: 'Genuine government portal',
    expect: 'legit',
    url: 'https://u.ae/ar-ae',
    title: 'البوابة الرسمية لحكومة دولة الإمارات العربية المتحدة',
    text: 'البوابة الرسمية لحكومة دولة الإمارات. معلومات وخدمات: التأشيرات والهوية، العمل، التعليم، الصحة، العدل والسلامة، الأعمال. تواصل مع الحكومة. عن دولة الإمارات.',
    ageDays: 6000,
  },
  {
    name: 'Genuine news article about scams',
    expect: 'legit',
    url: 'https://gulfnews.com/uae/crime/police-warn-of-fake-fine-messages',
    title: 'Police warn residents about fake traffic fine messages',
    text: 'Abu Dhabi Police have warned residents not to click links in messages claiming unpaid traffic fines. Officials said genuine fines are paid only through official apps. Scammers ask victims to enter card details and OTP codes on look-alike websites, the force said.',
    ageDays: 9000,
  },
  {
    name: 'Genuine local shop',
    expect: 'legit',
    url: 'https://www.sharafdg.com/',
    title: 'Sharaf DG - Online Shopping for Electronics in UAE',
    text: 'Shop mobiles, laptops, TVs and home appliances. Free delivery over AED 100. Sign in to your account. Track your order. Store locator. Cash on delivery and card payments accepted at checkout.',
    ageDays: 7000,
  },
  {
    name: 'HYBRID: clean-looking page, research says fake employer',
    expect: 'scam',
    url: 'https://gulf-energy-recruit.com/jobs/safety-officer',
    title: 'Safety Officer - Gulf Energy Recruitment',
    text: 'We are hiring a Safety Officer for a leading energy company in Abu Dhabi. Competitive salary and benefits. Apply today by sending your CV.',
    ageDays: 20,
    research: {
      researchModel: 'gemini (simulated for this smoke test)',
      liveSourcesChecked: true,
      researcherScamScore: 88,
      summaryEn:
        'No registered company named Gulf Energy Recruitment was found. The domain was registered 20 days ago. Two forum posts report this site asking applicants for an AED 750 visa fee by WhatsApp.',
      impersonatedEntity: null,
      confirmedPhishingOrScam: false,
      provablyFalseOrImpersonatedClaim: true,
      keyFindings: [
        { severity: 'high', title: 'Employer not found', detail: 'No trade licence or official site found for the named employer.' },
        { severity: 'high', title: 'Advance fee reports', detail: 'Applicants report being asked for a visa fee before any interview.' },
      ],
      sources: ['Forum thread: fake recruiter visa fee', 'Domain registration record'],
      jobAnalysis: null,
      mapAnalysis: null,
    },
  },
];

function toInput(c: Case): AiAnalysisInput {
  const host = new URL(c.url).hostname;
  return {
    mode: c.research ? 'job' : 'general',
    inputUrl: c.url,
    finalUrl: c.url,
    tls: { isHttps: true, valid: true, selfSigned: false, expired: false, hostnameMismatch: false, issuer: "Let's Encrypt", daysRemaining: 60, authorizationError: null } as AiAnalysisInput['tls'],
    registration: { registrableDomain: host, source: 'rdap', createdAt: null, registrar: null, domainAgeDays: c.ageDays ?? null, isNewlyRegistered: (c.ageDays ?? 9999) < 30, statuses: [] } as unknown as AiAnalysisInput['registration'],
    redirects: { hopCount: 0, crossDomainRedirect: false, chain: [] } as unknown as AiAnalysisInput['redirects'],
    headers: { httpStatus: 200 } as AiAnalysisInput['headers'],
    dns: { mxRecords: [], hasSpf: false, hasDmarc: false } as unknown as AiAnalysisInput['dns'],
    domAndForms: { browserCaptured: true, browserError: null, formCount: c.sensitive ? 1 : 0, hasPasswordInput: Boolean(c.sensitive), hasOtpInput: Boolean(c.sensitive), hasPaymentInput: Boolean(c.sensitive), hasGovIdInput: false, externalFormActions: [], exfiltrationEndpoints: [], obfuscatedScriptIndicators: [], hiddenElementCount: 0 } as unknown as AiAnalysisInput['domAndForms'],
    anomalies: { impersonatedBrand: c.impersonatedBrand ?? null, suspiciousTld: /\.(top|xyz)$/.test(host), tld: host.split('.').pop() } as unknown as AiAnalysisInput['anomalies'],
    promptInjection: { detected: false, severity: 'none', hiddenDomInjectionDetected: false, reviewInjectionDetected: false, unicodeTagSmugglingDetected: false, findings: [] } as unknown as AiAnalysisInput['promptInjection'],
    browser: { title: c.title, visibleText: c.text, metaTags: {}, jsonLdBlocks: [], suspiciousHiddenSnippets: [], htmlComments: [], ariaAndDataAttrs: [], mapReviews: [], extractedEmails: [], extractedPhones: [], socialMessagingLinks: [], coordinates: null } as unknown as AiAnalysisInput['browser'],
    research: c.research,
  };
}

const baseUrl = process.env.LOCAL_LLM_BASE_URL ?? 'http://127.0.0.1:8080/v1';
const model = process.env.LOCAL_LLM_MODEL ?? 'local-model';
const provider = createLocalLlmProvider({
  baseUrl,
  model,
  apiKey: process.env.LOCAL_LLM_API_KEY ?? null,
  timeoutMs: 120_000,
  maxPromptChars: Number(process.env.LOCAL_LLM_MAX_PROMPT_CHARS ?? 12_000),
});

console.log(`Judge: ${model} at ${baseUrl}\n`);
let correct = 0;
let failed = 0;
const times: number[] = [];

for (const c of CASES) {
  const started = Date.now();
  try {
    const a = await provider.run(toInput(c));
    const ms = Date.now() - started;
    times.push(ms);
    const score = a.aiScamScore ?? -1;
    const called = score >= 45 ? 'scam' : 'legit';
    const ok = called === c.expect;
    if (ok) correct += 1;
    console.log(`${ok ? 'OK  ' : 'MISS'} ${String(score).padStart(3)}  ${(ms / 1000).toFixed(1)}s  [expect ${c.expect}] ${c.name}`);
    console.log(`       EN: ${a.summaryEn.slice(0, 150)}`);
    console.log(`       AR: ${a.summaryAr.slice(0, 150)}`);
  } catch (err) {
    failed += 1;
    console.log(`FAIL            [expect ${c.expect}] ${c.name}: ${err instanceof Error ? err.message.slice(0, 160) : String(err)}`);
  }
}

const avg = times.length ? times.reduce((x, y) => x + y, 0) / times.length / 1000 : 0;
console.log(`\n${correct}/${CASES.length} judged as expected, ${failed} unusable replies, average ${avg.toFixed(1)}s per check.`);
