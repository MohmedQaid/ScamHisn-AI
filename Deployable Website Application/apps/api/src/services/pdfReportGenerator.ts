import type { Locale, ScanResponse } from '@scamhisn/shared';
import { getSharedBrowser } from '../inspectors/browserInspector.js';

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const VERDICT_LABELS: Record<ScanResponse['verdict'], { en: string; ar: string; color: string }> = {
  safe: { en: 'Likely Safe', ar: 'الرابط آمن', color: '#059669' },
  caution: { en: 'Proceed with Caution', ar: 'خلك حذر وتأكد أكثر', color: '#d97706' },
  suspicious: { en: 'Suspicious', ar: 'رابط مشبوه — انتبه!', color: '#ea580c' },
  high_risk: { en: 'High Scam Risk', ar: 'انتبه! احتمال احتيال عالي', color: '#e11d48' },
  confirmed_scam: { en: 'Confirmed Scam', ar: 'احتيال مؤكد', color: '#be123c' },
};

function buildReportHtml(report: ScanResponse, locale: Locale): string {
  const isAr = locale === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const verdict = VERDICT_LABELS[report.verdict];
  const verdictText = isAr ? verdict.ar : verdict.en;
  const { tls, domainRegistration, redirects, headers, dns, domAndForms, anomalies } =
    report.technicalChecks;

  const findingsHtml =
    report.redFlags.length === 0
      ? `<p class="muted">${isAr ? 'لم يتم رصد أي تنبيهات أو علامات احتيال حرجة.' : 'No critical red flags or scam anomalies were detected.'}</p>`
      : `<ul class="findings-list">
          ${report.redFlags
            .map(
              (f) => `
            <li class="finding-item sev-${escapeHtml(f.severity)}">
              <div class="finding-head">
                <span class="sev-badge sev-${escapeHtml(f.severity)}">${escapeHtml(f.severity.toUpperCase())}</span>
                <strong>${escapeHtml(isAr ? f.titleAr : f.titleEn)}</strong>
              </div>
              <p>${escapeHtml(isAr ? f.detailAr : f.detailEn)}</p>
            </li>`,
            )
            .join('')}
        </ul>`;

  const smokingGunsHtml =
    report.smokingGunsTriggered.length > 0
      ? `<section class="card alert-card">
          <h2>${isAr ? 'أدلة قاطعة تم رصدها (تصعيد تلقائي 95–100%)' : 'Fatal Smoking-Gun Triggers (Auto-Escalated 95–100%)'}</h2>
          <ul class="findings-list">
            ${report.smokingGunsTriggered
              .map(
                (sg) => `
              <li class="finding-item sev-critical">
                <strong>${escapeHtml(isAr ? sg.titleAr : sg.titleEn)}</strong>
                <p>${escapeHtml(isAr ? sg.detailAr : sg.detailEn)}</p>
              </li>`,
              )
              .join('')}
          </ul>
        </section>`
      : '';

  const promptInjectionHtml =
    report.promptInjection.detected || report.aiAnalysis.aiDetectedPromptInjection
      ? `<section class="card alert-card">
          <h2>${isAr ? 'تنبيه هجوم حقن أوامر (Prompt Injection)' : 'Prompt-Injection Attack Detected'}</h2>
          <p>${escapeHtml(
            report.aiAnalysis.promptInjectionEvidence ||
              (isAr
                ? 'تم رصد محاولة حقن أوامر خبيثة تحاول التلاعب بنتيجة الفحص.'
                : 'Malicious prompt-injection instructions attempting to manipulate the scam verdict were intercepted.'),
          )}</p>
        </section>`
      : '';

  // A report must say how much of the analysis ran: an investigator reading it later cannot tell
  // otherwise whether "no findings" means "clean" or "the AI never looked".
  const coverageLevel =
    report.coverage?.level ?? (report.aiAnalysis.status === 'unavailable' ? 'rules_only' : 'full');
  const COVERAGE_TEXT: Record<string, { en: string; ar: string }> = {
    full: {
      en: 'Full check: page opened, AI analysis with live sources.',
      ar: 'فحص كامل: تم فتح الصفحة والتحليل الذكي مع التحقق من المصادر المباشرة.',
    },
    partial: {
      en: 'Partial check: an AI model answered, but live sources were not checked or the page could not be opened.',
      ar: 'فحص جزئي: أجاب نموذج ذكاء اصطناعي، لكن لم يتم التحقق من المصادر المباشرة أو تعذّر فتح الصفحة.',
    },
    rules_only: {
      en: 'Incomplete check: AI analysis was unavailable. Findings are from technical checks only.',
      ar: 'فحص غير مكتمل: التحليل الذكي لم يكن متاحاً. النتائج من الفحوصات التقنية فقط.',
    },
    address_only: {
      en: 'Address-only check: the domain did not resolve, so the page could not be opened.',
      ar: 'فحص العنوان فقط: النطاق متوقف وتعذّر فتح الصفحة.',
    },
  };
  const coverageText = COVERAGE_TEXT[coverageLevel] ?? COVERAGE_TEXT.full!;
  const aiModelNote =
    report.aiAnalysis.status !== 'unavailable' ? ` (${escapeHtml(report.aiAnalysis.model)})` : '';

  const aiSummarySection = `<section class="card">
          <h2>${isAr ? 'ملخص التحليل والتوصية' : 'Analysis Summary & Recommendation'}</h2>
          <p><strong>${isAr ? 'نطاق الفحص:' : 'Coverage:'}</strong> ${escapeHtml(
            isAr ? coverageText.ar : coverageText.en,
          )}${aiModelNote}</p>
          <p>${escapeHtml(isAr ? report.aiAnalysis.summaryAr : report.aiAnalysis.summaryEn)}</p>
          <p class="rec-box"><strong>${isAr ? 'التوصية:' : 'Recommended Action:'}</strong> ${escapeHtml(
            isAr ? report.aiAnalysis.recommendationAr : report.aiAnalysis.recommendationEn,
          )}</p>
        </section>`;

  const rawJson = escapeHtml(JSON.stringify(report, null, 2));

  return `<!doctype html>
<html lang="${isAr ? 'ar' : 'en'}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <title>ScamHisn AI Forensic Report</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 28px 32px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.55;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #00734b;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .brand h1 {
      margin: 0;
      font-size: 20px;
      color: #00734b;
    }
    .brand p {
      margin: 3px 0 0;
      color: #475569;
      font-size: 11px;
    }
    .meta {
      text-align: ${isAr ? 'left' : 'right'};
      font-size: 10.5px;
      color: #475569;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .score-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
      background: #f8fafc;
      margin-bottom: 16px;
    }
    .score-num {
      font-size: 40px;
      font-weight: 800;
      color: ${verdict.color};
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      line-height: 1;
    }
    .verdict-pill {
      display: inline-block;
      margin-top: 6px;
      padding: 4px 12px;
      border-radius: 999px;
      background: ${verdict.color};
      color: #ffffff;
      font-weight: 700;
      font-size: 11.5px;
    }
    .url-box {
      flex: 1;
      font-size: 11px;
    }
    .url-box .lbl {
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      font-size: 10px;
    }
    .url-box .val {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      word-break: break-all;
      margin-bottom: 8px;
      direction: ltr;
      text-align: left;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 5px 8px;
      border-radius: 6px;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 14px;
      page-break-inside: avoid;
    }
    .alert-card {
      border-color: #fda4af;
      background: #fff1f2;
    }
    h2 {
      margin: 0 0 10px;
      font-size: 13.5px;
      color: #0f172a;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 6px;
    }
    .rec-box {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 8px 10px;
      border-radius: 6px;
      color: #065f46;
    }
    .findings-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .finding-item {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 10px;
      margin-bottom: 7px;
      background: #ffffff;
    }
    .finding-item p {
      margin: 4px 0 0;
      color: #334155;
      font-size: 11px;
    }
    .finding-head {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .sev-badge {
      font-size: 9.5px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .sev-critical { background: #be123c; color: #fff; }
    .sev-high { background: #ea580c; color: #fff; }
    .sev-medium { background: #fef3c7; color: #92400e; }
    .sev-low { background: #e0f2fe; color: #075985; }
    .sev-info { background: #f1f5f9; color: #334155; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 6px 8px;
      text-align: ${isAr ? 'right' : 'left'};
    }
    th {
      background: #f8fafc;
      font-weight: 700;
      width: 32%;
      color: #334155;
    }
    .json-section {
      page-break-before: always;
    }
    pre {
      background: #0f172a;
      color: #d1fae5;
      padding: 12px;
      border-radius: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 8.8px;
      line-height: 1.45;
      white-space: pre-wrap;
      word-break: break-all;
      direction: ltr;
      text-align: left;
    }
    .footer {
      margin-top: 18px;
      padding-top: 10px;
      border-top: 1px solid #cbd5e1;
      font-size: 10px;
      color: #475569;
    }
    .muted { color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>${isAr ? 'حصن الاحتيال — تقرير فحص جنائي رقمي' : 'ScamHisn AI — Digital Fraud Forensic Report'}</h1>
      <p>${isAr ? 'تقرير مخصص للاستخدام التوثيقي وإمكانية تقديمه للجهات المختصة والشرطة' : 'Structured technical evidence package formatted for official review & law-enforcement reporting'}</p>
    </div>
    <div class="meta">
      <div>Report ID: ${escapeHtml(report.scanId)}</div>
      <div>Date (UTC): ${escapeHtml(report.scannedAt)}</div>
      <div>Mode: ${escapeHtml(report.mode.toUpperCase())}</div>
    </div>
  </div>

  <div class="score-banner">
    <div style="text-align:center; min-width: 140px;">
      <div class="score-num">${report.scamScore}%</div>
      <div class="verdict-pill">${escapeHtml(verdictText)}</div>
    </div>
    <div class="url-box">
      <div class="lbl">${isAr ? 'الرابط المُدخل' : 'Submitted URL'}</div>
      <div class="val">${escapeHtml(report.inputUrl)}</div>
      <div class="lbl">${isAr ? 'الوجهة النهائية بعد التحويلات' : 'Final Destination URL'}</div>
      <div class="val">${escapeHtml(report.finalUrl)}</div>
    </div>
  </div>

  ${smokingGunsHtml}
  ${promptInjectionHtml}
  ${aiSummarySection}

  <section class="card">
    <h2>${isAr ? 'الملاحظات والتنبيهات المرصودة' : 'Detected Findings & Forensic Notes'}</h2>
    ${findingsHtml}
  </section>

  <section class="card">
    <h2>${isAr ? 'ملخص الفحوصات التقنية' : 'Technical Forensics Summary'}</h2>
    <table>
      <tr>
        <th>${isAr ? 'شهادة الأمان (SSL/TLS)' : 'SSL / TLS Status'}</th>
        <td>${escapeHtml(
          !tls.isHttps
            ? 'Plain HTTP (No TLS)'
            : tls.valid
              ? `Valid (${tls.protocol ?? 'TLS'}) — Issuer: ${tls.issuer ?? 'N/A'} — Days remaining: ${tls.daysRemaining ?? 'N/A'}`
              : `Invalid (${tls.authorizationError ?? 'Verification failed'})`,
        )}</td>
      </tr>
      <tr>
        <th>${isAr ? 'عمر النطاق والتسجيل' : 'Domain Age & Registration'}</th>
        <td>${escapeHtml(
          `${domainRegistration.registrableDomain ?? 'N/A'} | Age: ${
            domainRegistration.domainAgeDays !== null ? `${domainRegistration.domainAgeDays} days` : 'Unavailable'
          } | Created: ${domainRegistration.createdAt?.slice(0, 10) ?? 'N/A'} | Registrar: ${
            domainRegistration.registrar ?? 'N/A'
          }`,
        )}</td>
      </tr>
      <tr>
        <th>${isAr ? 'التحويلات وعناوين IP' : 'Redirects & Resolved IPs'}</th>
        <td>${escapeHtml(
          `${redirects.hopCount} hop(s), HTTP ${headers.httpStatus ?? 'N/A'} | IPs: ${
            report.technicalChecks.ssrf.resolvedIps.join(', ') || 'N/A'
          }`,
        )}</td>
      </tr>
      <tr>
        <th>${isAr ? 'ترويسات الحماية و DNS' : 'Security Headers & DNS Auth'}</th>
        <td>${escapeHtml(
          `HSTS:${headers.hsts ? 'Yes' : 'No'}, CSP:${headers.csp ? 'Yes' : 'No'}, X-Frame:${
            headers.xFrameOptions ? 'Yes' : 'No'
          } | SPF:${dns.hasSpf ? 'Yes' : 'No'}, DMARC:${dns.hasDmarc ? 'Yes' : 'No'}, MX:${dns.mxRecords.length}`,
        )}</td>
      </tr>
      <tr>
        <th>${isAr ? 'النماذج والانتحال' : 'Forms, Impersonation & Prompt Injection'}</th>
        <td>${escapeHtml(
          `Sensitive inputs:${domAndForms.hasSensitiveInputs ? 'Yes' : 'No'}, External actions:${
            domAndForms.externalFormActions.length
          }, Brand impersonation:${anomalies.impersonatedBrand ?? 'None'}, Prompt injection:${
            report.promptInjection.detected || report.aiAnalysis.aiDetectedPromptInjection ? 'DETECTED' : 'Clean'
          }`,
        )}</td>
      </tr>
    </table>
  </section>

  <section class="json-section">
    <h2>${isAr ? 'البيانات التقنية الكاملة (Raw Forensic JSON)' : 'Full Raw Technical Evidence (API v1 JSON)'}</h2>
    <pre>${rawJson}</pre>
  </section>

  <div class="footer">
    <strong>Team Cybersound</strong> — Mohammed Ahmed Abdulnoor, Abdulrhman Ahmed Drizi, Khalid Ahmed Al Khawaldah, Ahmed Al Hashmi, Yousef Mohammed.<br />
    Generated by ScamHisn AI (حصن الاحتيال) — REST API v1 (/api/v1/scan).
  </div>
</body>
</html>`;
}

/**
 * Generates an official A4 PDF forensic report from a verified ScanResponse using
 * the shared Playwright Chromium headless shell with JS & network strictly disabled.
 */
export async function generateForensicPdf(
  report: ScanResponse,
  locale: Locale = 'en',
): Promise<Buffer> {
  const html = buildReportHtml(report, locale);
  const browser = await getSharedBrowser();
  const context = await browser.newContext({
    javaScriptEnabled: false,
    offline: true,
  });

  try {
    const page = await context.newPage();
    await page.route('**/*', (route) => route.abort());
    await page.setContent(html, { waitUntil: 'load' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '14mm',
        bottom: '14mm',
        left: '12mm',
        right: '12mm',
      },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await context.close().catch(() => {});
  }
}
