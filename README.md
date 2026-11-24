<div align="center">

<img src="./assets/logo.svg" alt="ScamHisn AI Logo" width="84" height="84" />

# ScamHisn AI · حصن الاحتيال

**AI-Powered Scam & Link Inspector — Web App & Chrome Extension**

<p>
  <a href="https://scamhisn-ai.onrender.com/">
    <img src="https://img.shields.io/badge/Live%20Website-scamhisn--ai.onrender.com-00732F?style=for-the-badge" alt="Live Website" />
  </a>
  <img src="https://img.shields.io/badge/42%20Abu%20Dhabi%20%C3%97%20Abu%20Dhabi%20Police-SCAMSHIELD%20AI-CE1126?style=for-the-badge" alt="SCAMSHIELD AI Hackathon" />
  <img src="https://img.shields.io/badge/Team-Cybersound-111827?style=for-the-badge" alt="Team Cybersound" />
</p>

<p>
  <strong>🌐 Available in English &amp; Emirati Arabic · متوفر بالإنجليزية وبلهجتنا الإماراتية</strong><br />
  <a href="#english-version">🇬🇧 English (Below)</a> &nbsp;·&nbsp;
  <a href="#arabic-version">🇦🇪 العربية — لهجتنا الإماراتية (بالأسفل)</a> &nbsp;·&nbsp;
  <a href="./README.ar.md">📄 Standalone Arabic README (<code>README.ar.md</code>)</a>
</p>

</div>

---

<a id="english-version"></a>

## 🇬🇧 English

### What Is ScamHisn AI?

Our submission for the **42 Abu Dhabi × Abu Dhabi Police — SCAMSHIELD AI Hackathon** is both a **Web Application** and a **Chromium Browser Extension**, named **ScamHisn AI (حصن الاحتيال)**.

ScamHisn AI is an AI-based scam detector designed to work both **passively** (you paste or right-click a link to check it before clicking) and **proactively** (automatically scanning external links as they appear on open web pages like WhatsApp Web, Gmail, or LinkedIn).

> [!IMPORTANT]
> **Why only the passive (manual) version is deployed publicly:** We built both the passive and proactive versions (`Chrome Extension/deployable/` for production, and `Chrome Extension/dev/` for private developer testing). However, we only deployed the passive manual version online with a working API key—keeping proactive auto-scanning locked to *"Developers only"* in production—because exposing proactive background scanning publicly without user authentication could trigger unexpected API bills.

---

### Try It Live Right Now

👉 **Live Web App:** **[https://scamhisn-ai.onrender.com/](https://scamhisn-ai.onrender.com/)**

> [!NOTE]
> **Fair-Use Rate Limits on the Live Demo:** Our live API key is rate-limited to **15 requests/minute**, **500 requests/day**, and **50,000 tokens/minute**. These limits won't affect normal testing unless many people test simultaneously—so please test thoughtfully. *(Render's free instance may also take ~30–50 seconds to wake up on the very first visit after sitting idle.)*

---

### The Problem & Our Solution

Everyday residents in the UAE face realistic scam links every day—fake **UAE PASS**, **TAMM**, **Abu Dhabi Police**, **Salik**, **Emirates Post**, and local bank payment pages, fake recruitment/visa-fee job listings, and hijacked **Google Maps** business listings with fake helpline numbers or scam links buried in user reviews. Scammers hide behind link shorteners, redirect chains, brand-new domains, and even hidden AI **prompt-injection** tricks.

**ScamHisn AI** checks any link safely before you click and gives you:

- **Clear 0–100% Scam Score:** Simple enough for anyone to understand at a glance—while calibrated decisively so confirmed smoking guns (fake SSL on a login page, credential theft to a third-party domain, brand impersonation, or hidden prompt-injection attacks) immediately hit **95–100%** instead of being averaged down.
- **Three Focused Inspection Modes:**
  1. **General Link:** Catches phishing pages, redirects, fake payment portals, and UAE/global brand impersonation while keeping false positives low on official portals.
  2. **Job Post:** Verifies whether the link and employer are real, returning both a scam likelihood score and a job authenticity check.
  3. **Map Link:** Cross-checks the business location and audits descriptions and reviews for hijacked phone numbers, scam URLs, or hidden prompt-injection attacks.
- **Simple for Everyone, Deep for Investigators:** Everyday users see a clean, minimal percentage summary. Digital investigators can click **"Show Details"** to view every finding, SSL certificate metadata, RDAP/WHOIS domain age, resolved IPs, redirect chain, security headers, and full raw JSON.
- **Police-Ready PDF Evidence & Reporting Concept:** One click on **"Generate Report"** downloads a structured A4 PDF containing the scam probability, findings, WHOIS/TLS/IP telemetry, UTC timestamp, and full raw JSON—ready for investigation or takedown requests. Right next to it sits our conceptual **"Send to police for investigation"** button illustrating direct integration into police eCrime workflows.

---

### How to Use It (No Technical Background Needed)

#### 1. Using the Website (Phone or Laptop)
1. Open **[https://scamhisn-ai.onrender.com/](https://scamhisn-ai.onrender.com/)**.
2. Choose **General Link**, **Job Post**, or **Map Link**.
3. Paste the suspicious link and press **Inspect Link**.
4. Review the percentage verdict—click **Show Details** for full forensic evidence, or **Generate Report** to download a PDF.
   - *Tip for Phone Chrome users:* Tap Chrome's menu (`⋮` on Android / Share `⬆` on iPhone) → **Add to Home screen** to use ScamHisn AI like an app.

#### 2. Using the Chrome Extension (Laptop Chrome, Edge, Brave, Arc)
1. Download the extension `.zip` from the bottom of **[https://scamhisn-ai.onrender.com/](https://scamhisn-ai.onrender.com/)** (or use `Chrome Extension/scamhisn-extension-prod.zip` in this repo) and unzip it.
2. Open `chrome://extensions`, turn ON **Developer mode** (top right), click **Load unpacked**, and select the unzipped folder.
3. Click the **ScamHisn AI** icon in your toolbar (or right-click any link on a webpage → *"Inspect link with ScamHisn AI"*). You get the exact same categories, **Show Details**, **Report PDF**, and conceptual **Send to police** button—with *"Check Everything"* safely locked as *"Developers only"*.

---

### How It Works Under the Hood

| Technology | What We Use It For |
|---|---|
| **Playwright (Chromium Headless Shell)** | Safely opens suspicious links in an isolated throwaway sandbox (downloads, cookies, and private IPs blocked), follows full redirect chains/shorteners, and uncovers hidden DOM cloaking. |
| **Node.js `tls`, RDAP / WHOIS & `dns`** | Verifies SSL/TLS certificates, checks domain registration age to catch newly registered scam domains (`<30 days`), and inspects DNS/SPF/DMARC records. |
| **Local Heuristic & UAE Brand Guard** | Catches Punycode/lookalike domains, credential-harvesting forms, and impersonation of UAE government & bank portals (UAE PASS, TAMM, Abu Dhabi Police, UAE banks, etc.) while avoiding false positives on official domains. |
| **Anti-Prompt-Injection Shield** | Pre-scans visible text, hidden HTML, comments, and Maps reviews (English & Arabic, Base64, invisible Unicode tags) and isolates untrusted content inside cryptographic boundaries so scammers cannot trick the AI. |
| **Google Gemini (`gemini-3.5-flash-lite`) + Search/Maps Grounding** | Cross-checks real-world company claims, job listings, and map places, returning structured bilingual English & Emirati Arabic forensic verdicts. |
| **Versioned REST API (`/api/v1/scan`, `/api/v1/report/pdf`) + React** | One clean backend serving the web app, PDF generator, and Chrome extension—ready to scale into a police pilot. |

---

### Repository Contents

```text
ScamHisn AI/
├── Deployable Website Application/   ← Self-hostable full-stack app (Docker + Render ready)
├── Chrome Extension/                 ← Production (locked) & Dev (unlocked) extension + .zip
├── assets/logo.svg                   ← Official minimal UAE-colored Hisn emblem
├── .env.example                      ← Environment variable template (add your GEMINI_API_KEY)
├── README.md                         ← Bilingual README (English + Emirati Arabic)
└── README.ar.md                      ← Standalone Arabic README
```

---

### Want to Host Your Own Copy? (Short Summary)

Deploying takes a few minutes, so we already hosted a live version for you at **[https://scamhisn-ai.onrender.com/](https://scamhisn-ai.onrender.com/)**. If you want to host your own copy for free on **Render**:

1. Push the `Deployable Website Application/` folder to a GitHub repository.
2. Create a new **Blueprint** (or Docker Web Service) on [Render](https://render.com) linked to that repository.
3. Add your `GEMINI_API_KEY` (see `.env.example`) in Render's Environment Variables and deploy.

---

### Team Cybersound

Built with pride in the UAE for the **SCAMSHIELD AI Hackathon (42 Abu Dhabi × Abu Dhabi Police)**:

- **Mohammed Ahmed Abdulnoor**
- **Abdulrhman Ahmed Drizi**
- **Khalid Ahmed Al Khawaldah**
- **Ahmed Al Hashmi**
- **Yousef Mohammed**

---

<a id="arabic-version"></a>

<div dir="rtl">

## 🇦🇪 العربية (بلهجتنا الإماراتية)

### حياكم الله في حصن الاحتيال (ScamHisn AI)

مشروعنا في **هاكاثون درع الجريمة الإلكتروني (42 أبوظبي × شرطة أبوظبي)** هو **حصن الاحتيال (ScamHisn AI)**، وهو عبارة عن **تطبيق ويب** و**إضافة لمتصفح كروم** تشتغل بالذكاء الاصطناعي عشان تكشف الروابط الاحتيالية وتحميك قبل ما تضغط عليها.

النظام مصمم يشتغل بطريقتين: **الوضع اليدوي (Passive)** اللي تفحص فيه أي رابط بنفسك قبل ما تفتحه، و**الوضع التلقائي الاستباقي (Proactive)** اللي يراقب الروابط تلقائياً في الصفحات المفتوحة مثل واتساب ويب أو الإيميل.

> [!IMPORTANT]
> **ليش رفعنا الوضع اليدوي بس للعامة؟** نحن بنينا النسختين فعلياً (النسخة الرسمية `Chrome Extension/deployable` ونسخة المطورين `Chrome Extension/dev`). لكن في النسخة المنشورة أونلاين مع مفتاح الـ API شغّلنا الوضع اليدوي بس وخلّينا الفحص التلقائي مقفول تحت عبارة **"للمطورين فقط"**، لأن تشغيل الفحص التلقائي للكل بدون تسجيل دخول ممكن يستهلك رصيد الـ API بسرعة ويسبب فواتير عالية.

---

### جرّب الموقع الحين مباشرة

👉 **رابط التطبيق المباشر:** **[https://scamhisn-ai.onrender.com/](https://scamhisn-ai.onrender.com/)**

> [!NOTE]
> **ملاحظة بسيطة عن حدود الاستخدام:** مفتاح الـ API في النسخة التجريبية عليه حد أقصى: **15 طلب في الدقيقة**، و**500 طلب في اليوم**، و**50 ألف توكن في الدقيقة**. هالحدود ما بتأثر على تجربتك أبداً إلا لو وايد ناس جرّبوا الموقع في نفس الثانية، فجرّبوه على راحتكم وبهدوء. *(وإذا كان الموقع خامل شوي على Render، أول فتحة ممكن تاخذ 30 إلى 50 ثانية لين يشتغل).*

---

### شو المشكلة؟ وشو الحل اللي نقدمه؟

الناس عندنا في الإمارات يتعرضون يومياً لروابط احتيال متقنة — مواقع تنتحل **الهوية الرقمية (UAE PASS)**، و**تم (TAMM)**، و**شرطة أبوظبي**، و**سالك**، و**بريد الإمارات**، والبنوك المحلية، أو إعلانات وظائف وهمية تطلب رسوم فيزا، أو حتى صفحات **خرائط جوجل** بأرقام تواصل مخترقة وروابط احتيال مخفية في التقييمات. وفوق هذا، المحتالين صاروا يستخدمون اختصار الروابط، والتحويلات المخفية، والنطاقات اليديدة، وحتى خدع **حقن الأوامر (Prompt Injection)** عشان يغشون أنظمة الذكاء الاصطناعي.

**حصن الاحتيال** يفحص الرابط في بيئة معزولة ويعطيك الزبدة بوضوح:

- **نسبة احتمال الاحتيال (0% إلى 100%):** واضحة وبسيطة لأي شخص، وحازمة بدون تمييع — إذا فيه دليل قاطع مثل شهادة أمان مزوّرة على صفحة دخول، أو سرقة بيانات لموقع خارجي، أو انتحال جهة رسمية، أو محاولة حقن أوامر، النسبة تطلع فوراً **95%–100% (احتيال مؤكد)**.
- **ثلاثة أوضاع للفحص:**
  1. **رابط عام:** يكشف صفحات التصيّد، والتحويلات المضللة، وانتحال الجهات والبنوك الإماراتية، بدون ما يغلط ويصنّف المواقع الرسمية الحقيقية كاحتيال.
  2. **إعلان وظيفة:** يتأكد أول من شرعية الرابط، وبعدين يفحص مصداقية الشركة والوظيفة عشان يكشف إعلانات التوظيف الوهمية.
  3. **رابط خريطة:** يتحقق من وجود المكان فعلياً ويدقق في الوصف والتقييمات لكشف الأرقام المخترقة أو الروابط الخبيثة أو أوامر التلاعب المخفية.
- **سهل للشخص العادي، ومفصّل للمحقق الرقمي:** المستخدم العادي يشوف النسبة والخلاصة بشكل مرتب ومب معقّد. وإذا ضغطت **"عرض التفاصيل التقنية"** تطلع لك كل الأدلة: شهادة الأمان SSL، عمر النطاق (WHOIS/RDAP)، عناوين الـ IP، سلسلة التحويلات، العناصر المخفية، وملف الـ JSON الكامل.
- **تقرير PDF جاهز للشرطة + فكرة الإبلاغ المباشر:** بضغطة زر **"إنشاء تقرير (PDF)"** تقدر تحمّل ملف PDF مرتب فيه نسبة الاحتيال، الملاحظات، وبيانات الـ WHOIS والـ IP والتوقيت والـ JSON عشان يكون دليل جاهز للتسليم أو طلب الإزالة. وحطينا جنبه زر تجريبي (Concept) باسم **"إرسال للشرطة للتحقيق"** يوضح كيف ممكن ينربط النظام مستقبلاً مع شرطة أبوظبي.

---

### كيف تستخدمه؟ (وايد سهل وما يحتاج خبرة تقنية)

#### 1. استخدام الموقع (على الهاتف أو اللابتوب)
1. بطّل الرابط **[https://scamhisn-ai.onrender.com/](https://scamhisn-ai.onrender.com/)**.
2. اختر نوع الرابط: **رابط عام**، أو **إعلان وظيفة**، أو **رابط خريطة**.
3. الصق الرابط واضغط **افحص الرابط الحين**.
4. بتطلع لك النسبة والنتيجة — وتقدر تضغط **عرض التفاصيل التقنية** أو تحمّل **تقرير PDF**.
   - *لمستخدمي كروم على الهاتف:* اضغط قائمة كروم (`⋮` في أندرويد أو مشاركة `⬆` في آيفون) ← **إضافة إلى الشاشة الرئيسية** ويصير عندك مثل التطبيق.

#### 2. استخدام إضافة كروم (على اللابتوب — Chrome / Edge / Brave)
1. حمّل ملف الإضافة `.zip` من أسفل الموقع **[https://scamhisn-ai.onrender.com/](https://scamhisn-ai.onrender.com/)** (أو من مجلد `Chrome Extension/scamhisn-extension-prod.zip`) وفك الضغط عنه.
2. افتح `chrome://extensions` في المتصفح، وفعّل **Developer mode** من فوق، واضغط **Load unpacked** واختر المجلد المفكوك.
3. اضغط على أيقونة **حصن الاحتيال** في شريط المتصفح (أو اضغط بالزر اليمين على أي رابط في أي صفحة واختر *"Inspect link with ScamHisn AI"*). بتحصل نفس المزايا: التصنيف، **عرض التفاصيل**، **تقرير PDF**، وزر **إرسال للشرطة** التجريبي.

---

### كيف يشتغل النظام من الداخل؟

| التقنية | شو دورها في حصن الاحتيال؟ |
|---|---|
| **Playwright (متصفح Chromium معزول)** | يفتح الرابط داخل بيئة معزولة تماماً (بدون تنزيلات أو كوكيز أو وصول للشبكة الداخلية)، ويتتبع التحويلات والروابط المختصرة ويكشف العناصر المخفية في الصفحة. |
| **Node.js TLS و RDAP / WHOIS و DNS** | يفحص صلاحية شهادة الأمان SSL، ويكشف النطاقات المسجّلة حديثاً (أقل من 30 يوم)، ويتأكد من سجلات البريد والحماية SPF/DMARC. |
| **محرك الفحص المحلي وقائمة الجهات الإماراتية** | يكشف تزوير الأحرف المتشابهة (Punycode)، وسرقة بيانات الدخول، وانتحال الجهات المحلية (مثل UAE PASS، تم، شرطة أبوظبي، البنوك الإماراتية) بدقة عالية. |
| **درع صد حقن الأوامر (Anti-Prompt-Injection)** | يدقق النصوص الظاهرة والمخفية وتعليقات الـ HTML وتقييمات الخرائط (بالعربي والإنجليزي والـ Base64 والأحرف المخفية) ويعزل محتوى الصفحة بحدود مشفرة عشان محد يقدر يخدع الذكاء الاصطناعي. |
| **Google Gemini (`gemini-3.5-flash-lite`) مع بحث وخرائط جوجل** | يتحقق من صحة الشركات والوظائف والأماكن على أرض الواقع، ويعطيك ملخص واضح باللغتين الإنجليزية والإماراتية. |
| **واجهة برمجية موحّدة (`/api/v1/scan`) + React** | خادم واحد يخدم الموقع وتقارير الـ PDF وإضافة المتصفح بنفس الوقت، وجاهز للتوسع والتجربة الميدانية مع الجهات المختصة. |

---

### حاب ترفع نسختك الخاصة؟ (باختصار)

بما إن رفع التطبيق على السيرفر ياخذ شوية وقت، نحن جهّزناه ورفعناه لكم جاهز للتجربة على **[https://scamhisn-ai.onrender.com/](https://scamhisn-ai.onrender.com/)**. لكن لو حاب تستضيف نسختك الخاصة مجاناً على **Render**:

1. ارفع مجلد `Deployable Website Application/` على حسابك في GitHub.
2. سوّ **Blueprint** يديد (أو Docker Web Service) في موقع [Render](https://render.com) واربطه بالمستودع.
3. ضيف مفتاح `GEMINI_API_KEY` (نفس الموجود في `.env.example`) في إعدادات Environment Variables وشغّل النشر.

---

### فريق العمل — Team Cybersound

تم تطوير هذا المشروع في دولة الإمارات العربية المتحدة للمشاركة في **هاكاثون درع الجريمة الإلكتروني (42 أبوظبي × شرطة أبوظبي)** — والله يحفظكم ويبعد عنا وعنكم الشر:

- **Mohammed Ahmed Abdulnoor**
- **Abdulrhman Ahmed Drizi**
- **Khalid Ahmed Al Khawaldah**
- **Ahmed Al Hashmi**
- **Yousef Mohammed**

</div>
