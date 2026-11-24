import type { AiForensicAnalysis, AiProviderKind } from '@scamhisn/shared';
import type { AiAnalysisInput } from './types.js';

/**
 * AI fallback chain — no single point of failure.
 *
 * Providers are tried in order (primary Gemini → second key → backup Gemini model → self-hosted
 * model). The first one that answers wins. If none answers, the scan still completes on the
 * deterministic rules and says so honestly instead of pretending the AI looked at the page.
 */

export interface AiProvider {
  /** Stable identifier for logs, e.g. "gemini:key1:gemini-3.5-flash-lite". Never contains a secret. */
  id: string;
  kind: Exclude<AiProviderKind, 'none'>;
  model: string;
  run(input: AiAnalysisInput): Promise<AiForensicAnalysis>;
}

export interface AiChainAttempt {
  id: string;
  kind: AiProvider['kind'];
  model: string;
  ok: boolean;
  error: string | null;
  durationMs: number;
}

export interface AiChainResult {
  analysis: AiForensicAnalysis;
  provider: AiProviderKind;
  attempts: AiChainAttempt[];
}

export interface AiChainOptions {
  perProviderTimeoutMs?: number;
}

const DEFAULT_PROVIDER_TIMEOUT_MS = 30_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms} ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(String(err)));
      },
    );
  });
}

/** Quota / overload / network errors where retrying the SAME provider is pointless. */
export function isTransientAiError(message: string): boolean {
  return /\b(429|500|502|503|504)\b|RESOURCE_EXHAUSTED|UNAVAILABLE|overloaded|high demand|quota|rate.?limit|timed out|timeout|aborted|ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND|fetch failed/i.test(
    message,
  );
}

/** "Quota exceeded" specifically (as opposed to the model being overloaded or unreachable). */
export function isQuotaError(message: string): boolean {
  return /\b429\b|RESOURCE_EXHAUSTED|exceeded your current quota/i.test(message);
}

/** Errors that will not fix themselves in minutes: wrong model for this account, bad key. */
export function isPermanentAiError(message: string): boolean {
  return /\b(401|403|404)\b|NOT_FOUND|no longer available|not found for API version|API key not valid|API_KEY_INVALID|PERMISSION_DENIED|UNAUTHENTICATED/i.test(
    message,
  );
}

function shorten(message: string, max = 300): string {
  const flat = message.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

export function buildUnavailableAnalysis(
  reason: string,
  options: { model: string; configured: boolean },
): AiForensicAnalysis {
  return {
    status: 'unavailable',
    error: reason,
    model: options.model,
    groundingUsed: [],
    groundingSources: [],
    aiScamScore: null,
    confidence: null,
    aiDetectedPromptInjection: false,
    promptInjectionEvidence: null,
    impersonatedEntity: null,
    provablyFalseOrImpersonatedClaim: false,
    confirmedPhishingOrScam: false,
    summaryEn: options.configured
      ? 'Technical checks completed (certificate, domain age, redirects, page forms, manipulation screening). The AI analysis could not be reached, so this result is based on technical checks only.'
      : 'Technical checks completed (certificate, domain age, redirects, page forms, manipulation screening). AI analysis is not configured on this server, so this result is based on technical checks only.',
    summaryAr: options.configured
      ? 'تم إكمال الفحوصات التقنية (الشهادة، عمر النطاق، التحويلات، نماذج الصفحة، وكشف محاولات التلاعب). تعذّر الوصول إلى التحليل الذكي، لذلك النتيجة مبنية على الفحوصات التقنية فقط.'
      : 'تم إكمال الفحوصات التقنية (الشهادة، عمر النطاق، التحويلات، نماذج الصفحة، وكشف محاولات التلاعب). التحليل الذكي غير مفعّل على هذا الخادم، لذلك النتيجة مبنية على الفحوصات التقنية فقط.',
    recommendationEn:
      'Treat this as an incomplete check. Review the technical findings below and do not share personal details unless you reached the site yourself from an official source.',
    recommendationAr:
      'اعتبر هذا الفحص غير مكتمل. راجع النتائج التقنية تحت، ولا تشارك بياناتك إلا إذا دخلت الموقع بنفسك من مصدر رسمي.',
    keyFindings: [],
    jobAnalysis: null,
    mapAnalysis: null,
  };
}

export async function runAiChain(
  providers: AiProvider[],
  input: AiAnalysisInput,
  options: AiChainOptions = {},
): Promise<AiChainResult> {
  const attempts: AiChainAttempt[] = [];
  const timeoutMs = options.perProviderTimeoutMs ?? DEFAULT_PROVIDER_TIMEOUT_MS;

  if (providers.length === 0) {
    return {
      analysis: buildUnavailableAnalysis(
        'AI is not configured on the server (no Gemini API key and no local model).',
        { model: 'none', configured: false },
      ),
      provider: 'none',
      attempts,
    };
  }

  for (const provider of providers) {
    const startedAt = Date.now();
    try {
      const analysis = await withTimeout(provider.run(input), timeoutMs, provider.id);
      attempts.push({
        id: provider.id,
        kind: provider.kind,
        model: provider.model,
        ok: true,
        error: null,
        durationMs: Date.now() - startedAt,
      });
      return { analysis, provider: provider.kind, attempts };
    } catch (err) {
      const message = shorten(err instanceof Error ? err.message : String(err));
      attempts.push({
        id: provider.id,
        kind: provider.kind,
        model: provider.model,
        ok: false,
        error: message,
        durationMs: Date.now() - startedAt,
      });
      console.warn(`[ScamHisn AI chain] ${provider.id} failed: ${message}`);
    }
  }

  const last = attempts[attempts.length - 1];
  return {
    analysis: buildUnavailableAnalysis(
      `All ${attempts.length} AI provider(s) failed. Last error: ${last?.error ?? 'unknown'}`,
      { model: providers[0]?.model ?? 'none', configured: true },
    ),
    provider: 'none',
    attempts,
  };
}
