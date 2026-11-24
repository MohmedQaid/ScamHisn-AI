import crypto from 'node:crypto';
import { parse as parseDomain } from 'tldts';
import type { ScanRequest, ScanResponse, TechnicalChecks } from '@scamhisn/shared';
import { config } from '../config.js';
import { assertSafeUrl, SsrfError } from '../security/ssrfGuard.js';
import { inspectInHeadlessBrowser } from '../inspectors/browserInspector.js';
import { inspectTls } from '../inspectors/tlsInspector.js';
import { inspectDomainRegistration } from '../inspectors/rdapInspector.js';
import { inspectDns } from '../inspectors/dnsInspector.js';
import { runHeuristicAnalysis } from '../inspectors/heuristicAnalyzer.js';
import { scanForPromptInjection } from '../security/promptInjectionScanner.js';
import { analyzeWithGemini } from '../ai/geminiAnalyzer.js';
import { computeDecisiveScore } from '../scoring/scoringEngine.js';

class ConcurrencySemaphore {
  private active = 0;
  private readonly queue: Array<() => void> = [];

  constructor(private readonly maxConcurrency: number) {}

  async acquire(timeoutMs = 10_000): Promise<void> {
    if (this.active < this.maxConcurrency) {
      this.active++;
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.queue.indexOf(onReady);
        if (idx >= 0) this.queue.splice(idx, 1);
        reject(
          new SsrfError(
            'SCAN_QUEUE_BUSY',
            'Scanner is currently at maximum concurrency. Please retry in a few seconds.',
            'خادم الفحص مشغول حالياً بطلبات ثانية، حاول مرة ثانية بعد ثواني.',
            503,
          ),
        );
      }, timeoutMs);

      const onReady = () => {
        clearTimeout(timer);
        this.active++;
        resolve();
      };
      this.queue.push(onReady);
    });
  }

  release(): void {
    this.active = Math.max(0, this.active - 1);
    const next = this.queue.shift();
    if (next) next();
  }
}

const scanSemaphore = new ConcurrencySemaphore(config.maxConcurrentScans);

export async function runUrlScan(request: ScanRequest): Promise<ScanResponse> {
  const startedAt = Date.now();
  const scanId = crypto.randomUUID();

  // 1. Pre-flight URL validation & SSRF protection (DNS lookup + private/loopback IP block)
  const safeInitial = await assertSafeUrl(request.url);
  const initialRegDomain = parseDomain(safeInitial.hostname).domain ?? null;

  await scanSemaphore.acquire();
  try {
    // 2. Run isolated Playwright headless inspection alongside initial TLS, RDAP, and DNS checks
    const [browser, initialTls, initialReg, initialDns] = await Promise.all([
      inspectInHeadlessBrowser(safeInitial.normalizedUrl, request.mode),
      inspectTls(safeInitial.url),
      inspectDomainRegistration(safeInitial.hostname),
      inspectDns(safeInitial.hostname, initialRegDomain),
    ]);

    // 3. If redirects landed on a different host/protocol, re-verify SSRF and inspect final destination
    let finalUrlObj = safeInitial.url;
    let resolvedIps = safeInitial.resolvedIps;
    let tls = initialTls;
    let registration = initialReg;
    let dns = initialDns;

    if (browser.finalUrl && browser.finalUrl !== safeInitial.normalizedUrl) {
      const safeFinal = await assertSafeUrl(browser.finalUrl);
      finalUrlObj = safeFinal.url;
      resolvedIps = Array.from(new Set([...safeInitial.resolvedIps, ...safeFinal.resolvedIps]));

      const finalHostChanged = safeFinal.hostname !== safeInitial.hostname;
      const finalProtocolChanged = safeFinal.url.protocol !== safeInitial.url.protocol;
      const finalRegDomain = parseDomain(safeFinal.hostname).domain ?? null;

      const refreshTasks: Array<Promise<void>> = [];
      if (finalHostChanged || finalProtocolChanged) {
        refreshTasks.push(
          inspectTls(safeFinal.url).then((res) => {
            tls = res;
          }),
        );
      }
      if (finalHostChanged) {
        if (finalRegDomain !== initialRegDomain) {
          refreshTasks.push(
            inspectDomainRegistration(safeFinal.hostname).then((res) => {
              registration = res;
            }),
          );
        }
        refreshTasks.push(
          inspectDns(safeFinal.hostname, finalRegDomain).then((res) => {
            dns = res;
          }),
        );
      }
      if (refreshTasks.length > 0) {
        await Promise.all(refreshTasks);
      }
    }

    // 4. Local heuristic & anomaly checks
    const heuristics = runHeuristicAnalysis({
      initialUrl: safeInitial.url,
      finalUrl: finalUrlObj,
      tls,
      registration,
      dns,
      browser,
    });

    // 5. Deterministic multi-channel anti-prompt-injection pre-scanner
    const promptInjection = scanForPromptInjection({
      visibleText: browser.visibleText,
      hiddenDomTexts: browser.hiddenDomTexts,
      htmlComments: browser.htmlComments,
      metaTexts: Object.entries(browser.metaTags).map(([k, v]) => `${k}: ${v}`),
      mapReviews: browser.mapReviews,
      ariaAndDataAttrs: browser.ariaAndDataAttrs,
    });

    // 6. Gemini 3.5 Flash-Lite grounded & structured forensic inspection
    const aiAnalysis = await analyzeWithGemini({
      mode: request.mode,
      inputUrl: safeInitial.normalizedUrl,
      finalUrl: finalUrlObj.toString(),
      tls,
      registration,
      redirects: heuristics.redirects,
      headers: heuristics.headers,
      dns,
      domAndForms: heuristics.domAndForms,
      anomalies: heuristics.anomalies,
      promptInjection,
      browser,
    });

    const technicalChecks: TechnicalChecks = {
      ssrf: {
        passed: true,
        resolvedIps,
      },
      tls,
      domainRegistration: registration,
      redirects: heuristics.redirects,
      headers: heuristics.headers,
      dns,
      domAndForms: heuristics.domAndForms,
      anomalies: heuristics.anomalies,
    };

    // 7. Decisive hybrid 0–100% scoring engine (with fatal smoking-gun floors)
    const scoring = computeDecisiveScore({
      mode: request.mode,
      technicalChecks,
      heuristicFlags: heuristics.flags,
      promptInjection,
      aiAnalysis,
    });

    return {
      scanId,
      scannedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      mode: request.mode,
      inputUrl: safeInitial.normalizedUrl,
      finalUrl: finalUrlObj.toString(),
      scamScore: scoring.scamScore,
      verdict: scoring.verdict,
      scoreBreakdown: scoring.scoreBreakdown,
      smokingGunsTriggered: scoring.smokingGunsTriggered,
      redFlags: scoring.redFlags,
      technicalChecks,
      promptInjection,
      aiAnalysis,
    };
  } finally {
    scanSemaphore.release();
  }
}
