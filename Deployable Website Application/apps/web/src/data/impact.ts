import type { Locale } from '@scamhisn/shared';

/**
 * Content for the Impact page. Every figure is either measured by us (accuracy), taken from a
 * cited source (problem figures, list prices), or an estimate whose assumptions are shown on the
 * page. Full workings: docs/IMPACT.md. Full reference list: docs/research/sources.md.
 */

export interface ImpactSource {
  id: number;
  label: string;
  url: string;
}

export const IMPACT_SOURCES: ImpactSource[] = [
  {
    id: 1,
    label: 'Global Anti-Scam Alliance and Trend Micro, State of Scams in the UAE (published 27 Jan 2026; survey of 1,000 residents)',
    url: 'https://gasa.org/knowledge-base/blog/scams-hit-uae-residents-every-three-days-on-average-new-research-finds',
  },
  {
    id: 2,
    label: 'Gulf News, "Abu Dhabi Police recover Dh140 million from online fraud cases" (22 Oct 2025)',
    url: 'https://gulfnews.com/uae/crime/abu-dhabi-police-recover-dh140-million-from-online-fraud-cases-1.500316909',
  },
  {
    id: 3,
    label: 'WAM, 2024 State of Scams in UAE survey (UAE Cyber Security Council, TRENDS, GASA, BioCatch; 28 Nov 2024)',
    url: 'https://www.wam.ae/en/article/b6f93te-2024-state-scams-uae-survey-reveals-65-scam',
  },
  {
    id: 4,
    label: 'TDRA open data on Bayanat, ICT access and use by households and individuals (2025 figures)',
    url: 'https://bayanat.ae/en/Datasets/Dataset-info?id=J4Pr9Mk6_5Pi2ylTYcJjkdlNNHje1AL52E',
  },
  {
    id: 5,
    label: 'Gulf News, "Abu Dhabi Police warn public about fake links in search engines" (7 Jun 2026)',
    url: 'https://gulfnews.com/uae/crime/abu-dhabi-police-warn-public-about-fake-links-in-search-engines-1.500566188',
  },
  {
    id: 6,
    label: 'Google, Gemini Developer API pricing (read 24 Nov 2026)',
    url: 'https://ai.google.dev/gemini-api/docs/pricing',
  },
  {
    id: 7,
    label: 'Render, Pricing (read 24 Nov 2026)',
    url: 'https://render.com/pricing',
  },
  {
    id: 8,
    label: 'Abu Dhabi Police, Aman service contact channels',
    url: 'https://aman.adpolice.gov.ae/contact',
  },
];

interface Stat {
  value: string;
  label: string;
  source: number;
}

interface CostRow {
  scale: string;
  users: string;
  withoutLookups: string;
  withLookups: string;
}

export interface ImpactContent {
  eyebrow: string;
  title: string;
  lead: string;
  problemTitle: string;
  problemStats: Stat[];
  problemNote: string;
  accuracyTitle: string;
  accuracyStats: Array<{ value: string; label: string }>;
  accuracyNote: string;
  costTitle: string;
  costLead: string;
  costHeaders: [string, string, string, string];
  costRows: CostRow[];
  costNote: string;
  savingsTitle: string;
  savingsHeadline: string;
  savingsSteps: string[];
  savingsNote: string;
  chainTitle: string;
  chainSteps: string[];
  chainNote: string;
  roadmapTitle: string;
  roadmapTag: string;
  roadmap: Array<{ title: string; text: string }>;
  sourcesTitle: string;
  measuredTag: string;
  estimateTag: string;
  citedTag: string;
}

export const IMPACT: Record<Locale, ImpactContent> = {
  en: {
    eyebrow: 'Impact',
    title: 'The case for ScamHisn, in numbers',
    lead: 'Rule-based forensics and multimodal AI working together, with a UAE-built Arabic model as backup. Measured where we could measure, cited where we could not.',
    problemTitle: 'The problem',
    problemStats: [
      { value: '7 in 10', label: 'UAE residents have met a scam', source: 1 },
      { value: '1 in 3', label: 'lost money to one in the past year', source: 1 },
      { value: 'Dh140M', label: 'returned to victims by Abu Dhabi Police in two years', source: 2 },
      { value: '15,642', label: 'online fraud cases handled in the same two years', source: 2 },
    ],
    problemNote:
      'Almost everyone is exposed: 100% of individuals use the internet and 82% bank online [4]. Abu Dhabi Police have warned about fake links in search results [5].',
    accuracyTitle: 'How well it works',
    accuracyStats: [
      { value: '91.5%', label: 'accuracy on 141 addresses it had never seen' },
      { value: '0', label: 'false alarms on 76 real sites' },
      { value: '53 of 65', label: 'fake look-alikes caught from the address alone' },
    ],
    accuracyNote:
      'This is one layer only: the address check that still works when a scam site is already offline. The 12 misses had no brand name in them; opening the page and the AI analysis are the layers meant to catch those. Look-alike addresses in the test are synthetic.',
    costTitle: 'What it costs to run',
    costLead: 'About $0.004 per scan (AED 0.014) for the AI, or $0.018 with live Google lookups.',
    costHeaders: ['Scans per day', 'Weekly users', 'Monthly, no live lookups', 'Monthly, with live lookups'],
    costRows: [
      { scale: '500 (today)', users: '1,750', withoutLookups: '$0, free tiers', withLookups: 'not on free tier' },
      { scale: '1,000', users: '3,500', withoutLookups: '$140', withLookups: '$490' },
      { scale: '10,000', users: '35,000', withoutLookups: '$1,300', withLookups: '$5,400' },
      { scale: '100,000', users: '350,000', withoutLookups: '$12,300', withLookups: '$54,200' },
    ],
    costNote:
      'List prices for Gemini 3.5 Flash-Lite and Render [6][7]. Assumes about 5,000 input and 900 output tokens per scan and two scans a week per user. Free for residents.',
    savingsTitle: 'What it could save',
    savingsHeadline: 'Every 1% of losses prevented among 10,000 residents is about AED 270,000 a year.',
    savingsSteps: [
      '10,000 residents × 1 in 3 losing money in a year [1] = about 3,300 victims',
      '× $2,194 average loss per victim [3] = about $7.3 million at risk',
      '× 1% prevented = about $73,000 (AED 270,000)',
    ],
    savingsNote:
      'An illustration, not a forecast. The share of losses a checker prevents has not been measured, and the two survey figures come from different years.',
    chainTitle: 'It does not go dark',
    chainSteps: ['Gemini', 'Second key', 'Backup model', 'Jais 2, UAE-built', 'Rules only'],
    chainNote:
      'If one step is busy or over its limit, the next one answers. When only the rules run, the result says "Incomplete check" and is never shown as safe.',
    roadmapTitle: 'Where it goes next',
    roadmapTag: 'Planned, not built',
    roadmap: [
      {
        title: 'Better model, better results',
        text: 'The AI model is one setting. A stronger model can be switched in without changing the app, and the same test set shows whether it helped.',
      },
      {
        title: 'Trained on Emirati scams',
        text: 'Collect and label real Arabic and Emirati-dialect scam messages, then fine-tune a small Arabic model on them.',
      },
      {
        title: 'Check the claim, not only the link',
        text: 'With TAMM: a message says you owe a fine, your record says you do not. A concept that needs a government integration.',
      },
    ],
    sourcesTitle: 'Sources',
    measuredTag: 'Measured by us',
    estimateTag: 'Estimate',
    citedTag: 'Cited',
  },

  ar: {
    eyebrow: 'الأثر',
    title: 'لماذا «حصن الاحتيال»؟ بالأرقام',
    lead: 'فحوصات تقنية بقواعد واضحة مع ذكاء اصطناعي متعدد الوسائط، ونموذج عربي إماراتي كبديل احتياطي. قِسنا ما أمكن قياسه، ووثّقنا مصدر ما لم نقِسه.',
    problemTitle: 'المشكلة',
    problemStats: [
      { value: '7 من 10', label: 'من سكان الإمارات تعرّضوا لمحاولة احتيال', source: 1 },
      { value: '1 من 3', label: 'خسروا مالاً بسبب الاحتيال خلال سنة', source: 1 },
      { value: '140 مليون درهم', label: 'أعادتها شرطة أبوظبي للضحايا خلال سنتين', source: 2 },
      { value: '15,642', label: 'قضية احتيال إلكتروني في الفترة نفسها', source: 2 },
    ],
    problemNote:
      'الجميع تقريباً معرّض: 100% من الأفراد يستخدمون الإنترنت و82% يستخدمون الخدمات المصرفية عبره [4]. وقد حذّرت شرطة أبوظبي من الروابط المزيفة في نتائج محركات البحث [5].',
    accuracyTitle: 'ما مدى دقته؟',
    accuracyStats: [
      { value: '91.5%', label: 'دقة على 141 عنواناً لم يرها من قبل' },
      { value: '0', label: 'إنذار كاذب على 76 موقعاً حقيقياً' },
      { value: '53 من 65', label: 'عنواناً مقلّداً كُشف من العنوان وحده' },
    ],
    accuracyNote:
      'هذه طبقة واحدة فقط: فحص العنوان الذي يعمل حتى لو توقف موقع الاحتيال. الحالات الـ12 التي لم تُكشف لا تحمل اسم جهة؛ وفتح الصفحة والتحليل الذكي هما الطبقتان المخصصتان لها. العناوين المقلّدة في الاختبار مصطنعة.',
    costTitle: 'كم يكلّف تشغيله؟',
    costLead: 'نحو 0.004 دولار للفحص الواحد (0.014 درهم) للذكاء الاصطناعي، أو 0.018 دولار مع التحقق المباشر من جوجل.',
    costHeaders: ['فحوصات يومياً', 'مستخدمون أسبوعياً', 'شهرياً دون تحقق مباشر', 'شهرياً مع تحقق مباشر'],
    costRows: [
      { scale: '500 (اليوم)', users: '1,750', withoutLookups: 'صفر، باقات مجانية', withLookups: 'غير متاح مجاناً' },
      { scale: '1,000', users: '3,500', withoutLookups: '140 دولاراً', withLookups: '490 دولاراً' },
      { scale: '10,000', users: '35,000', withoutLookups: '1,300 دولار', withLookups: '5,400 دولار' },
      { scale: '100,000', users: '350,000', withoutLookups: '12,300 دولار', withLookups: '54,200 دولار' },
    ],
    costNote:
      'الأسعار المعلنة لـ Gemini 3.5 Flash-Lite و Render [6][7]. بافتراض نحو 5,000 رمز إدخال و900 رمز إخراج لكل فحص، وفحصين أسبوعياً لكل مستخدم. الخدمة مجانية للسكان.',
    savingsTitle: 'كم يمكن أن يوفّر؟',
    savingsHeadline: 'كل 1% من الخسائر نمنعها بين 10,000 ساكن تساوي نحو 270 ألف درهم سنوياً.',
    savingsSteps: [
      '10,000 ساكن × 1 من 3 يخسرون مالاً خلال سنة [1] = نحو 3,300 ضحية',
      '× 2,194 دولاراً متوسط الخسارة للضحية [3] = نحو 7.3 مليون دولار معرّضة للخسارة',
      '× 1% نمنعها = نحو 73 ألف دولار (270 ألف درهم)',
    ],
    savingsNote:
      'مثال توضيحي لا توقّع. نسبة الخسائر التي يمنعها الفاحص لم تُقَس بعد، والرقمان من استبيانين في سنتين مختلفتين.',
    chainTitle: 'لا يتوقف',
    chainSteps: ['Gemini', 'مفتاح ثانٍ', 'نموذج احتياطي', 'جيس 2 الإماراتي', 'القواعد فقط'],
    chainNote:
      'إذا انشغلت حلقة أو تجاوزت حدّها أجابت التالية. وعندما تعمل القواعد وحدها تظهر النتيجة «فحص غير مكتمل» ولا تُعرض أبداً على أنها آمنة.',
    roadmapTitle: 'إلى أين بعد ذلك؟',
    roadmapTag: 'مخطط له، لم يُنفّذ بعد',
    roadmap: [
      {
        title: 'نموذج أقوى، نتائج أفضل',
        text: 'نموذج الذكاء الاصطناعي إعداد واحد. يمكن استبداله بنموذج أقوى دون تغيير التطبيق، ومجموعة الاختبار نفسها تُظهر هل تحسّنت النتائج.',
      },
      {
        title: 'تدريب على احتيال محلي',
        text: 'جمع وتصنيف رسائل احتيال حقيقية بالعربية وباللهجة الإماراتية، ثم تدريب نموذج عربي صغير عليها.',
      },
      {
        title: 'فحص الادعاء لا الرابط فقط',
        text: 'مع «تم»: الرسالة تقول عليك مخالفة، وسجلّك يقول لا شيء عليك. تصوّر يحتاج تكاملاً حكومياً.',
      },
    ],
    sourcesTitle: 'المصادر',
    measuredTag: 'قياسنا',
    estimateTag: 'تقدير',
    citedTag: 'موثّق',
  },
};
