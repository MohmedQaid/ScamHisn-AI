# Voice-over script for the one-minute cut

The film is 59 seconds. A voice at a natural pace says about 2.5 words a second, so the whole script has room for roughly 115 words. The first recording was about 102 seconds in English and 121 in Arabic, which is why it could not be laid over the film.

Each line below belongs to one moment of the picture. **Starts at** is where the first word should land; **Room** is the longest the line may run before the next picture arrives.

Record one clip per line, in this order, and save them as `01.mp3` to `13.mp3` in `voice-over/en-60s/` and `voice-over/ar-60s/`. Lines 1 and 13 are optional.

## English

| # | Starts at | Room | Line | On screen |
|---|---|---|---|---|
| 1 | 0:01.0 | 3.0 s | You get a message about a fine. Real, or fake? | The phone and the SMS |
| 2 | 0:04.4 | 5.6 s | Seven in ten people in the UAE have faced a scam. One in three lost money. | 7 in 10 · 1 in 3 · Dh140M |
| 3 | 0:10.4 | 3.0 s | ScamHisn AI. Check before you click. | The name |
| 4 | 0:14.0 | 4.2 s | Paste any link, job post, map listing or screenshot. | The app assembles, the link is typed |
| 5 | 0:20.9 | 3.3 s | In seconds, a clear verdict with the evidence. | The number counts to 84% |
| 6 | 0:24.4 | 4.4 s | It names who is being faked, and catches links that are already offline. | The two lifted pieces |
| 7 | 0:29.2 | 4.0 s | Gemini researches. Falcon-H1, built in Abu Dhabi, judges. | The two model cards |
| 8 | 0:33.5 | 4.6 s | No single point of failure. If one fails, the next takes over. | The fallback chain |
| 9 | 0:38.6 | 4.2 s | In Arabic and English, on the web and in Chrome. | The Arabic verdict, the four kinds of check |
| 10 | 0:43.4 | 3.8 s | One click for an evidence report and the official Aman channels. | The report buttons and the Aman panel |
| 11 | 0:47.7 | 4.2 s | Measured: ninety-one point five percent accuracy, zero false alarms. | 91.5% · 0 · 139 |
| 12 | 0:52.4 | 3.0 s | Today, the link. Next, with TAMM, the claim. | The two closing lines |
| 13 | 0:56.0 | 2.0 s | ScamHisn AI. | The phone and the name |

## العربية

| # | يبدأ عند | المدة المتاحة | الجملة |
|---|---|---|---|
| 1 | 0:01.0 | 3.0 ث | وصلتك رسالة مخالفة؟ حقيقية أم مزيّفة؟ |
| 2 | 0:04.4 | 5.6 ث | سبعة من كل عشرة في الإمارات واجهوا محاولة احتيال، وواحد من كل ثلاثة خسر مالاً. |
| 3 | 0:10.4 | 3.0 ث | حصن الاحتيال. افحص قبل ما تضغط. |
| 4 | 0:14.0 | 4.2 ث | الصق أي رابط أو إعلان وظيفة أو موقع خريطة أو لقطة شاشة. |
| 5 | 0:20.9 | 3.3 ث | وفي ثوانٍ: حكم واضح مع الأدلة. |
| 6 | 0:24.4 | 4.4 ث | يكشف الجهة المنتحَلة، ويلتقط الروابط حتى بعد توقفها. |
| 7 | 0:29.2 | 4.0 ث | Gemini يبحث، و Falcon-H1 المطوَّر في أبوظبي يحكم. |
| 8 | 0:33.5 | 4.6 ث | بلا نقطة فشل واحدة: إذا تعطّل واحد تولّى التالي. |
| 9 | 0:38.6 | 4.2 ث | بالعربية والإنجليزية، على الويب وفي كروم. |
| 10 | 0:43.4 | 3.8 ث | بضغطة واحدة: تقرير أدلة وقنوات «أمان» الرسمية. |
| 11 | 0:47.7 | 4.2 ث | بالقياس: دقة 91.5 بالمئة، وصفر إنذارات كاذبة. |
| 12 | 0:52.4 | 3.0 ث | اليوم نفحص الرابط، وغداً مع «تم» نتحقق من الادعاء. |
| 13 | 0:56.0 | 2.0 ث | حصن الاحتيال. |

## How the clips are placed

`assets/vo/<language>/placement.json` lists each clip with the time its first word should land. `scripts/ae_short.jsx` (English) and `scripts/ae_short_ar.jsx` (Arabic) build the 59-second comp from that list: the film sped up evenly, the sound effects at -25 dB, the voice on top. Every clip is its own layer in After Effects, so a line can be nudged by hand.

## What the English draft uses today

Until shorter clips exist, the English film carries the six original clips that fit end to end: the name, "paste any link", the verdict, the two agents, bilingual, and blind testing. The lines about impersonation, the fallback chain, formats, the evidence report and TAMM are not in it.
