import { chromium, type Browser, type Response } from 'playwright';
import { parse as parseDomain } from 'tldts';
import type { HiddenDomSnippet, RedirectHop, ScanMode } from '@scamhisn/shared';
import { config } from '../config.js';
import { assertSafeUrl, SsrfError } from '../security/ssrfGuard.js';

export interface ExtractedFormInfo {
  action: string | null;
  method: string;
  hasPassword: boolean;
  hasOtp: boolean;
  hasPayment: boolean;
  hasGovId: boolean;
  inputNames: string[];
}

export interface BrowserInspectionResult {
  captured: boolean;
  error: string | null;
  initialUrl: string;
  finalUrl: string;
  httpStatus: number | null;
  responseHeaders: Record<string, string>;
  redirectChain: RedirectHop[];
  maxHopsExceeded: boolean;
  title: string | null;
  metaTags: Record<string, string>;
  jsonLdBlocks: string[];
  visibleText: string;
  forms: ExtractedFormInfo[];
  hasPasswordInput: boolean;
  hasOtpInput: boolean;
  hasPaymentInput: boolean;
  hasGovIdInput: boolean;
  externalFormActions: string[];
  hiddenElementCount: number;
  hiddenDomTexts: string[];
  suspiciousHiddenSnippets: HiddenDomSnippet[];
  htmlComments: string[];
  ariaAndDataAttrs: string[];
  externalScriptDomains: string[];
  iframeDomains: string[];
  obfuscatedScriptIndicators: string[];
  exfiltrationEndpoints: string[];
  metaRefreshTarget: string | null;
  coordinates: { latitude: number; longitude: number } | null;
  mapReviews: string[];
  extractedPhones: string[];
  extractedEmails: string[];
  socialMessagingLinks: string[];
}

let sharedBrowser: Browser | null = null;
let browserLaunchPromise: Promise<Browser> | null = null;

export async function getSharedBrowser(): Promise<Browser> {
  if (sharedBrowser && sharedBrowser.isConnected()) {
    return sharedBrowser;
  }

  if (!browserLaunchPromise) {
    browserLaunchPromise = chromium
      .launch({
        headless: config.playwrightHeadless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-background-networking',
          '--disable-sync',
          '--metrics-recording-only',
          '--no-first-run',
          '--mute-audio',
        ],
      })
      .then((browser) => {
        sharedBrowser = browser;
        browser.on('disconnected', () => {
          if (sharedBrowser === browser) {
            sharedBrowser = null;
          }
        });
        return browser;
      })
      .finally(() => {
        browserLaunchPromise = null;
      });
  }

  return browserLaunchPromise;
}

export async function closeSharedBrowser(): Promise<void> {
  if (sharedBrowser) {
    try {
      await sharedBrowser.close();
    } catch {
      // ignore
    }
    sharedBrowser = null;
  }
}

/**
 * Extracts latitude/longitude from Google Maps / Apple Maps / OpenStreetMap URLs.
 */
export function extractCoordinatesFromUrl(
  rawUrl: string,
): { latitude: number; longitude: number } | null {
  // Pattern 1: /@25.2048,55.2708,15z
  const atMatch = /@(-?\d{1,2}\.\d{3,}),(-?\d{1,3}\.\d{3,})/.exec(rawUrl);
  if (atMatch?.[1] && atMatch[2]) {
    const lat = Number.parseFloat(atMatch[1]);
    const lng = Number.parseFloat(atMatch[2]);
    if (isValidLatLng(lat, lng)) return { latitude: lat, longitude: lng };
  }

  // Pattern 2: !3d25.2048!4d55.2708
  const bangMatch = /!3d(-?\d{1,2}\.\d{3,})!4d(-?\d{1,3}\.\d{3,})/.exec(rawUrl);
  if (bangMatch?.[1] && bangMatch[2]) {
    const lat = Number.parseFloat(bangMatch[1]);
    const lng = Number.parseFloat(bangMatch[2]);
    if (isValidLatLng(lat, lng)) return { latitude: lat, longitude: lng };
  }

  // Pattern 3: ?q=25.2048,55.2708 or ll=25.2048,55.2708
  const queryMatch = /[?&](?:q|ll|query|center)=(-?\d{1,2}\.\d{3,}),\s*(-?\d{1,3}\.\d{3,})/.exec(
    rawUrl,
  );
  if (queryMatch?.[1] && queryMatch[2]) {
    const lat = Number.parseFloat(queryMatch[1]);
    const lng = Number.parseFloat(queryMatch[2]);
    if (isValidLatLng(lat, lng)) return { latitude: lat, longitude: lng };
  }

  return null;
}

function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

const BLOCKED_RESOURCE_TYPES = new Set([
  'image',
  'media',
  'font',
  'websocket',
  'eventsource',
  'manifest',
]);

/**
 * Inspects a URL in an isolated, ephemeral Playwright Chromium headless shell context.
 * Blocks heavy resources, disables downloads/storage, validates SSRF on every redirect hop,
 * and extracts visible text, hidden DOM nodes, forms, scripts, comments, and map/job signals.
 */
export async function inspectInHeadlessBrowser(
  initialUrl: string,
  mode: ScanMode,
): Promise<BrowserInspectionResult> {
  const fallback: BrowserInspectionResult = {
    captured: false,
    error: null,
    initialUrl,
    finalUrl: initialUrl,
    httpStatus: null,
    responseHeaders: {},
    redirectChain: [{ url: initialUrl, status: null }],
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
    coordinates: extractCoordinatesFromUrl(initialUrl),
    mapReviews: [],
    extractedPhones: [],
    extractedEmails: [],
    socialMessagingLinks: [],
  };

  let browser: Browser;
  try {
    browser = await getSharedBrowser();
  } catch (err) {
    return {
      ...fallback,
      error: `Headless browser unavailable: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const context = await browser.newContext({
    acceptDownloads: false,
    serviceWorkers: 'block',
    ignoreHTTPSErrors: true,
    javaScriptEnabled: true,
    viewport: { width: 1280, height: 800 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
    locale: 'en-US',
  });

  const page = await context.newPage();
  let mainDocHopCount = 0;
  let maxHopsExceeded = false;
  let ssrfBlockedMessage: string | null = null;

  try {
    // Hardened request router: block heavy media & guard every navigation/redirect against SSRF
    await page.route('**/*', async (route) => {
      const req = route.request();
      const resourceType = req.resourceType();
      const reqUrl = req.url();

      if (BLOCKED_RESOURCE_TYPES.has(resourceType)) {
        await route.abort();
        return;
      }

      // Allow safe about:blank
      if (reqUrl === 'about:blank') {
        await route.continue();
        return;
      }

      // Block non-HTTP(S) navigations
      if (!reqUrl.startsWith('http://') && !reqUrl.startsWith('https://')) {
        await route.abort();
        return;
      }

      // Re-verify SSRF safety on every main-frame and iframe navigation/redirect
      if (req.isNavigationRequest()) {
        if (req.frame() === page.mainFrame()) {
          mainDocHopCount++;
          if (mainDocHopCount > config.maxRedirectHops + 1) {
            maxHopsExceeded = true;
            await route.abort();
            return;
          }
        }

        try {
          await assertSafeUrl(reqUrl);
        } catch (err) {
          if (err instanceof SsrfError) {
            ssrfBlockedMessage = err.message;
          }
          await route.abort();
          return;
        }
      }

      await route.continue();
    });

    // Block popups and dialogs cleanly
    page.on('dialog', (dialog) => {
      void dialog.dismiss().catch(() => {});
    });

    let mainResponse: Response | null = null;
    try {
      mainResponse = await page.goto(initialUrl, {
        waitUntil: 'domcontentloaded',
        timeout: config.navigationTimeoutMs,
      });
    } catch (navErr) {
      if (ssrfBlockedMessage) {
        throw new SsrfError(
          'SSRF_REDIRECT_BLOCKED',
          `Redirect blocked by SSRF guard: ${ssrfBlockedMessage}`,
          'تم حظر تحويل الرابط لأنه يوجّه إلى عنوان داخلي غير مسموح.',
          403,
        );
      }
      // If we partially loaded DOM before timeout, still try to inspect; otherwise return error
      const currentUrl = page.url();
      if (!currentUrl || currentUrl === 'about:blank') {
        return {
          ...fallback,
          maxHopsExceeded,
          error: navErr instanceof Error ? navErr.message : 'Navigation failed',
        };
      }
    }

    if (ssrfBlockedMessage) {
      throw new SsrfError(
        'SSRF_REDIRECT_BLOCKED',
        `Redirect blocked by SSRF guard: ${ssrfBlockedMessage}`,
        'تم حظر تحويل الرابط لأنه يوجّه إلى عنوان داخلي غير مسموح.',
        403,
      );
    }

    // Brief bounded settle wait for SPA/Maps hydration without slowing scans
    const settleMs = mode === 'map' ? 2200 : 1100;
    await page.waitForLoadState('networkidle', { timeout: settleMs }).catch(() => {});

    const finalUrl = page.url() && page.url() !== 'about:blank' ? page.url() : initialUrl;

    // Reconstruct full redirect chain from mainResponse
    const redirectChain: RedirectHop[] = [];
    if (mainResponse) {
      const chainStack: RedirectHop[] = [];
      let req: ReturnType<Response['request']> | null = mainResponse.request();
      while (req) {
        const resp = await req.response().catch(() => null);
        chainStack.push({
          url: req.url(),
          status: resp ? resp.status() : null,
        });
        req = req.redirectedFrom();
      }
      chainStack.reverse();
      redirectChain.push(...chainStack);
    }
    if (redirectChain.length === 0) {
      redirectChain.push({ url: initialUrl, status: null });
      if (finalUrl !== initialUrl) {
        redirectChain.push({ url: finalUrl, status: mainResponse?.status() ?? null });
      }
    }

    const rawHeaders: Record<string, string> = mainResponse
      ? await mainResponse.allHeaders().catch((): Record<string, string> => ({}))
      : {};
    const responseHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawHeaders)) {
      if (typeof v === 'string') {
        responseHeaders[k.toLowerCase()] = v;
      }
    }

    // Extract DOM, hidden elements, forms, comments, scripts, map reviews & contact markers
    const extracted = await page.evaluate((scanMode: string) => {
      const title = document.title?.trim() || null;

      // 1. Meta tags & meta-refresh
      const metaTags: Record<string, string> = {};
      let metaRefreshTarget: string | null = null;
      document.querySelectorAll('meta').forEach((m) => {
        const key = (m.getAttribute('name') || m.getAttribute('property') || m.getAttribute('http-equiv') || '')
          .trim()
          .toLowerCase();
        const content = (m.getAttribute('content') || '').trim();
        if (key && content) {
          metaTags[key] = content.slice(0, 500);
          if (key === 'refresh') {
            const urlMatch = /url\s*=\s*['"]?([^'";\s]+)/i.exec(content);
            if (urlMatch?.[1]) metaRefreshTarget = urlMatch[1];
          }
        }
      });

      // 2. JSON-LD structured metadata (JobPosting / LocalBusiness / Organization)
      const jsonLdBlocks: string[] = [];
      document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
        const txt = el.textContent?.trim();
        if (txt) jsonLdBlocks.push(txt.slice(0, 3500));
      });

      // 3. Visible text
      const visibleText = (document.body?.innerText || '').replace(/\s+\n/g, '\n').trim().slice(0, 10_000);

      // 4. Forms & standalone sensitive inputs
      const passwordPattern = /pass(word|code|wd)?|pwd|pin\b|secret/i;
      const otpPattern = /\botp\b|one[-_ ]?time|verification[-_ ]?code|sms[-_ ]?code|2fa|mfa|auth[-_ ]?code/i;
      const paymentPattern =
        /card[-_ ]?(num|no|number|holder)|credit[-_ ]?card|debit[-_ ]?card|\bcvv\b|\bcvc\b|expir(y|ation)|iban|routing|bank[-_ ]?account|swift/i;
      const govIdPattern =
        /emirates[-_ ]?id|national[-_ ]?id|passport[-_ ]?(no|num|number)|ssn|social[-_ ]?security|iqama|uae[-_ ]?pass/i;

      const classifyInput = (el: HTMLInputElement | HTMLTextAreaElement) => {
        const type = (el.getAttribute('type') || '').toLowerCase();
        const autocomplete = (el.getAttribute('autocomplete') || '').toLowerCase();
        const combined = [
          el.getAttribute('name'),
          el.getAttribute('id'),
          el.getAttribute('placeholder'),
          el.getAttribute('aria-label'),
          autocomplete,
        ]
          .filter(Boolean)
          .join(' ');

        return {
          isPassword: type === 'password' || passwordPattern.test(combined),
          isOtp: autocomplete === 'one-time-code' || otpPattern.test(combined),
          isPayment:
            autocomplete.startsWith('cc-') || paymentPattern.test(combined),
          isGovId: govIdPattern.test(combined),
          name: el.getAttribute('name') || el.getAttribute('id') || type || 'input',
        };
      };

      const forms: Array<{
        action: string | null;
        method: string;
        hasPassword: boolean;
        hasOtp: boolean;
        hasPayment: boolean;
        hasGovId: boolean;
        inputNames: string[];
      }> = [];

      let hasPasswordInput = false;
      let hasOtpInput = false;
      let hasPaymentInput = false;
      let hasGovIdInput = false;

      document.querySelectorAll('form').forEach((form) => {
        const rawAction = form.getAttribute('action');
        let resolvedAction: string | null = null;
        if (rawAction && rawAction.trim() && !rawAction.trim().startsWith('#') && !rawAction.trim().startsWith('javascript:')) {
          try {
            resolvedAction = new URL(rawAction, window.location.href).toString();
          } catch {
            resolvedAction = rawAction;
          }
        }

        const fInfo = {
          action: resolvedAction,
          method: (form.getAttribute('method') || 'GET').toUpperCase(),
          hasPassword: false,
          hasOtp: false,
          hasPayment: false,
          hasGovId: false,
          inputNames: [] as string[],
        };

        form.querySelectorAll('input, textarea').forEach((node) => {
          const el = node as HTMLInputElement | HTMLTextAreaElement;
          const type = (el.getAttribute('type') || '').toLowerCase();
          if (type === 'hidden' || type === 'submit' || type === 'button') return;
          const cls = classifyInput(el);
          if (cls.isPassword) fInfo.hasPassword = true;
          if (cls.isOtp) fInfo.hasOtp = true;
          if (cls.isPayment) fInfo.hasPayment = true;
          if (cls.isGovId) fInfo.hasGovId = true;
          if (fInfo.inputNames.length < 12) fInfo.inputNames.push(cls.name.slice(0, 40));
        });

        if (fInfo.hasPassword) hasPasswordInput = true;
        if (fInfo.hasOtp) hasOtpInput = true;
        if (fInfo.hasPayment) hasPaymentInput = true;
        if (fInfo.hasGovId) hasGovIdInput = true;
        forms.push(fInfo);
      });

      // Also inspect standalone inputs outside <form> (common in React/Vue phishing kits)
      document.querySelectorAll('input, textarea').forEach((node) => {
        const el = node as HTMLInputElement | HTMLTextAreaElement;
        const type = (el.getAttribute('type') || '').toLowerCase();
        if (type === 'hidden' || type === 'submit' || type === 'button') return;
        const cls = classifyInput(el);
        if (cls.isPassword) hasPasswordInput = true;
        if (cls.isOtp) hasOtpInput = true;
        if (cls.isPayment) hasPaymentInput = true;
        if (cls.isGovId) hasGovIdInput = true;
      });

      // 5. Hidden DOM element inspection (prompt-injection & cloaking defense)
      let hiddenElementCount = 0;
      const hiddenDomTexts: string[] = [];
      const suspiciousHiddenSnippets: Array<{ technique: string; tag: string; snippet: string }> = [];
      const ariaAndDataAttrs: string[] = [];

      const candidates = document.querySelectorAll(
        'body *:not(script):not(style):not(noscript):not(svg):not(path):not(meta):not(link)',
      );
      const maxNodesToInspect = Math.min(candidates.length, 1500);

      for (let i = 0; i < maxNodesToInspect; i++) {
        const el = candidates[i] as HTMLElement;
        if (!el) continue;

        // Check suspiciously long aria-label / data-* attributes (common stealth injection vectors)
        for (const attr of Array.from(el.attributes)) {
          if (
            (attr.name === 'aria-label' || attr.name === 'title' || attr.name.startsWith('data-')) &&
            attr.value.length >= 45 &&
            ariaAndDataAttrs.length < 25
          ) {
            ariaAndDataAttrs.push(`${attr.name}=${attr.value.slice(0, 350)}`);
          }
        }

        // Only consider leaf-ish nodes with direct text so we don't duplicate entire containers
        let directText = '';
        for (const child of Array.from(el.childNodes)) {
          if (child.nodeType === Node.TEXT_NODE && child.textContent) {
            directText += child.textContent;
          }
        }
        const trimmed = directText.replace(/\s+/g, ' ').trim();
        if (trimmed.length < 12) continue;

        const style = window.getComputedStyle(el);
        const techniques: string[] = [];

        if (style.display === 'none') techniques.push('display:none');
        if (style.visibility === 'hidden') techniques.push('visibility:hidden');
        const opacity = Number.parseFloat(style.opacity);
        if (Number.isFinite(opacity) && opacity <= 0.05) techniques.push(`opacity:${opacity}`);
        const fontSize = Number.parseFloat(style.fontSize);
        if (Number.isFinite(fontSize) && fontSize <= 2) techniques.push(`font-size:${fontSize}px`);

        const left = Number.parseFloat(style.left);
        const top = Number.parseFloat(style.top);
        const textIndent = Number.parseFloat(style.textIndent);
        if (
          (Number.isFinite(left) && left < -400) ||
          (Number.isFinite(top) && top < -400) ||
          (Number.isFinite(textIndent) && textIndent < -400)
        ) {
          techniques.push('off-screen');
        }

        const rect = el.getBoundingClientRect();
        if (
          (rect.width <= 1 && rect.height <= 1 && style.overflow === 'hidden') ||
          style.clip === 'rect(0px, 0px, 0px, 0px)'
        ) {
          techniques.push('zero-size-clip');
        }

        if (
          style.color &&
          style.backgroundColor &&
          style.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
          style.backgroundColor !== 'transparent' &&
          style.color === style.backgroundColor
        ) {
          techniques.push('color-match-background');
        }

        if (techniques.length > 0) {
          hiddenElementCount++;
          if (hiddenDomTexts.length < 30) {
            hiddenDomTexts.push(trimmed.slice(0, 600));
          }
          if (suspiciousHiddenSnippets.length < 15) {
            suspiciousHiddenSnippets.push({
              technique: techniques.join(', '),
              tag: el.tagName.toLowerCase(),
              snippet: trimmed.slice(0, 260),
            });
          }
        }
      }

      // 6. HTML comments via TreeWalker
      const htmlComments: string[] = [];
      const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_COMMENT);
      let commentNode = walker.nextNode();
      while (commentNode && htmlComments.length < 25) {
        const text = (commentNode.textContent || '').replace(/\s+/g, ' ').trim();
        if (text.length >= 15) {
          htmlComments.push(text.slice(0, 500));
        }
        commentNode = walker.nextNode();
      }

      // 7. External scripts, iframes, inline obfuscation & credential exfiltration endpoints
      const externalScripts: string[] = [];
      const obfuscatedScriptIndicators: string[] = [];
      const exfiltrationEndpoints: string[] = [];

      document.querySelectorAll('script').forEach((script) => {
        const src = script.getAttribute('src');
        if (src) {
          try {
            externalScripts.push(new URL(src, window.location.href).hostname.toLowerCase());
          } catch {
            // ignore
          }
        } else {
          const code = script.textContent || '';
          if (code.length > 30) {
            if (/\beval\s*\(\s*(atob|unescape|decodeURIComponent|function\s*\(p,a,c,k,e)/i.test(code)) {
              obfuscatedScriptIndicators.push('Packed/obfuscated eval() payload');
            }
            if (/String\.fromCharCode\s*\((?:\s*\d+\s*,){8,}/i.test(code)) {
              obfuscatedScriptIndicators.push('Large String.fromCharCode() obfuscated string');
            }
            if (/_0x[a-f0-9]{4,}/i.test(code) && code.length > 600) {
              obfuscatedScriptIndicators.push('Obfuscated _0x hex-identifier JavaScript');
            }
            if (/api\.telegram\.org\/bot/i.test(code)) {
              exfiltrationEndpoints.push('api.telegram.org/bot (Telegram bot credential exfiltration)');
            }
            if (/discord(?:app)?\.com\/api\/webhooks\//i.test(code)) {
              exfiltrationEndpoints.push('discord.com/api/webhooks (Discord webhook exfiltration)');
            }
            if (/formsubmit\.co|getform\.io|web3forms\.com/i.test(code)) {
              exfiltrationEndpoints.push('Disposable third-party form collector endpoint');
            }
          }
        }
      });

      const iframeDomains: string[] = [];
      document.querySelectorAll('iframe[src]').forEach((iframe) => {
        const src = iframe.getAttribute('src');
        if (!src) return;
        try {
          iframeDomains.push(new URL(src, window.location.href).hostname.toLowerCase());
        } catch {
          // ignore
        }
      });

      // 8. Map reviews & business descriptions (especially for Google Maps / map links)
      const mapReviews: string[] = [];
      if (scanMode === 'map' || /google\.[^/]+\/maps|maps\.apple\.com|openstreetmap\.org/i.test(window.location.href)) {
        const reviewSelectors = [
          '[data-review-id]',
          '.wiI7pd',
          '.MyEned',
          '[aria-label*="review" i]',
          '[class*="review" i]',
          '[itemprop="reviewBody"]',
          '[itemprop="description"]',
        ];
        const seenReviews = new Set<string>();
        for (const selector of reviewSelectors) {
          document.querySelectorAll(selector).forEach((el) => {
            const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
            if (txt.length >= 20 && !seenReviews.has(txt) && mapReviews.length < 25) {
              seenReviews.add(txt);
              mapReviews.push(txt.slice(0, 600));
            }
          });
        }
      }

      // 9. Contact emails, phone numbers, and WhatsApp/Telegram links (crucial for job & map fraud)
      const emailMatches = visibleText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      const phoneMatches = visibleText.match(/(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}/g) || [];
      const socialMessagingLinks: string[] = [];
      document.querySelectorAll('a[href]').forEach((a) => {
        const href = (a.getAttribute('href') || '').trim();
        if (/(?:wa\.me|api\.whatsapp\.com|t\.me|telegram\.me|bit\.ly|tinyurl\.com)/i.test(href)) {
          socialMessagingLinks.push(href.slice(0, 180));
        }
      });

      return {
        title,
        metaTags,
        jsonLdBlocks: jsonLdBlocks.slice(0, 6),
        visibleText,
        forms: forms.slice(0, 20),
        hasPasswordInput,
        hasOtpInput,
        hasPaymentInput,
        hasGovIdInput,
        hiddenElementCount,
        hiddenDomTexts,
        suspiciousHiddenSnippets,
        htmlComments,
        ariaAndDataAttrs,
        externalScripts: Array.from(new Set(externalScripts)).slice(0, 30),
        iframeDomains: Array.from(new Set(iframeDomains)).slice(0, 15),
        obfuscatedScriptIndicators: Array.from(new Set(obfuscatedScriptIndicators)),
        exfiltrationEndpoints: Array.from(new Set(exfiltrationEndpoints)),
        metaRefreshTarget,
        mapReviews,
        extractedEmails: Array.from(new Set(emailMatches)).slice(0, 15),
        extractedPhones: Array.from(
          new Set(phoneMatches.filter((p) => p.replace(/\D/g, '').length >= 8)),
        ).slice(0, 15),
        socialMessagingLinks: Array.from(new Set(socialMessagingLinks)).slice(0, 15),
      };
    }, mode);

    // Determine cross-domain form actions comparing eTLD+1 registrable domains
    const finalParsed = parseDomain(finalUrl);
    const pageRegDomain = (finalParsed.domain ?? finalParsed.hostname ?? '').toLowerCase();

    const externalFormActions: string[] = [];
    for (const f of extracted.forms) {
      if (!f.action) continue;
      try {
        const actionParsed = parseDomain(f.action);
        const actionReg = (actionParsed.domain ?? actionParsed.hostname ?? '').toLowerCase();
        if (actionReg && pageRegDomain && actionReg !== pageRegDomain) {
          externalFormActions.push(f.action);
        }
      } catch {
        // ignore
      }
    }

    const externalScriptDomains = extracted.externalScripts.filter((host) => {
      const p = parseDomain(host);
      return (p.domain ?? host) !== pageRegDomain;
    });

    const coordinates =
      extractCoordinatesFromUrl(finalUrl) ?? extractCoordinatesFromUrl(initialUrl);

    return {
      captured: true,
      error: null,
      initialUrl,
      finalUrl,
      httpStatus: mainResponse?.status() ?? null,
      responseHeaders,
      redirectChain,
      maxHopsExceeded,
      title: extracted.title,
      metaTags: extracted.metaTags,
      jsonLdBlocks: extracted.jsonLdBlocks,
      visibleText: extracted.visibleText,
      forms: extracted.forms,
      hasPasswordInput: extracted.hasPasswordInput,
      hasOtpInput: extracted.hasOtpInput,
      hasPaymentInput: extracted.hasPaymentInput,
      hasGovIdInput: extracted.hasGovIdInput,
      externalFormActions: Array.from(new Set(externalFormActions)),
      hiddenElementCount: extracted.hiddenElementCount,
      hiddenDomTexts: extracted.hiddenDomTexts,
      suspiciousHiddenSnippets: extracted.suspiciousHiddenSnippets,
      htmlComments: extracted.htmlComments,
      ariaAndDataAttrs: extracted.ariaAndDataAttrs,
      externalScriptDomains: externalScriptDomains.slice(0, 20),
      iframeDomains: extracted.iframeDomains,
      obfuscatedScriptIndicators: extracted.obfuscatedScriptIndicators,
      exfiltrationEndpoints: extracted.exfiltrationEndpoints,
      metaRefreshTarget: extracted.metaRefreshTarget,
      coordinates,
      mapReviews: extracted.mapReviews,
      extractedPhones: extracted.extractedPhones,
      extractedEmails: extracted.extractedEmails,
      socialMessagingLinks: extracted.socialMessagingLinks,
    };
  } finally {
    await context.close().catch(() => {});
  }
}
