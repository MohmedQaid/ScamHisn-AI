import test from 'node:test';
import assert from 'node:assert/strict';
import type { AiForensicAnalysis } from '@scamhisn/shared';
import { runAiChain, type AiProvider } from '../ai/aiChain.js';
import { createLocalLlmProvider } from '../ai/localLlmProvider.js';
import type { GeminiAnalysisInput } from '../ai/geminiAnalyzer.js';

function analysis(overrides: Partial<AiForensicAnalysis> = {}): AiForensicAnalysis {
  return {
    status: 'completed',
    error: null,
    model: 'test-model',
    groundingUsed: ['google_search'],
    groundingSources: [],
    aiScamScore: 12,
    confidence: 'high',
    aiDetectedPromptInjection: false,
    promptInjectionEvidence: null,
    impersonatedEntity: null,
    provablyFalseOrImpersonatedClaim: false,
    confirmedPhishingOrScam: false,
    summaryEn: 'ok',
    summaryAr: 'تمام',
    recommendationEn: 'ok',
    recommendationAr: 'تمام',
    keyFindings: [],
    jobAnalysis: null,
    mapAnalysis: null,
    ...overrides,
  };
}

function provider(
  id: string,
  kind: AiProvider['kind'],
  behaviour: () => Promise<AiForensicAnalysis>,
  calls: string[],
): AiProvider {
  return {
    id,
    kind,
    model: `${id}-model`,
    run: async () => {
      calls.push(id);
      return behaviour();
    },
  };
}

const INPUT = {} as GeminiAnalysisInput;

test('uses the first provider when it answers and never calls the rest', async () => {
  const calls: string[] = [];
  const result = await runAiChain(
    [
      provider('primary', 'gemini', async () => analysis(), calls),
      provider('backup', 'gemini_backup', async () => analysis(), calls),
    ],
    INPUT,
  );
  assert.deepEqual(calls, ['primary']);
  assert.equal(result.provider, 'gemini');
  assert.equal(result.analysis.status, 'completed');
});

test('falls through to the next provider when one is rate limited', async () => {
  const calls: string[] = [];
  const result = await runAiChain(
    [
      provider('primary', 'gemini', async () => {
        throw new Error('429 RESOURCE_EXHAUSTED: quota exceeded');
      }, calls),
      provider('second-key', 'gemini_backup', async () => analysis({ aiScamScore: 88 }), calls),
      provider('local', 'local', async () => analysis(), calls),
    ],
    INPUT,
  );
  assert.deepEqual(calls, ['primary', 'second-key']);
  assert.equal(result.provider, 'gemini_backup');
  assert.equal(result.analysis.aiScamScore, 88);
  assert.equal(result.attempts[0]?.ok, false);
  assert.match(result.attempts[0]?.error ?? '', /429/);
});

test('reaches the local model when every cloud provider is down', async () => {
  const calls: string[] = [];
  const down = async (): Promise<AiForensicAnalysis> => {
    throw new Error('503 UNAVAILABLE: model is experiencing high demand');
  };
  const result = await runAiChain(
    [
      provider('primary', 'gemini', down, calls),
      provider('backup-model', 'gemini_backup', down, calls),
      provider('jais', 'local', async () => analysis({ status: 'degraded', groundingUsed: [] }), calls),
    ],
    INPUT,
  );
  assert.deepEqual(calls, ['primary', 'backup-model', 'jais']);
  assert.equal(result.provider, 'local');
});

test('when every provider fails the result is honest about it', async () => {
  const result = await runAiChain(
    [
      provider('primary', 'gemini', async () => {
        throw new Error('503 UNAVAILABLE');
      }, []),
    ],
    INPUT,
  );
  assert.equal(result.provider, 'none');
  assert.equal(result.analysis.status, 'unavailable');
  assert.equal(result.analysis.aiScamScore, null);
  assert.match(result.analysis.error ?? '', /503/);
  // The key IS configured here, so the text must not tell anyone to configure it.
  assert.doesNotMatch(result.analysis.summaryEn, /Configure GEMINI_API_KEY/i);
  assert.match(result.analysis.summaryEn, /could not be reached|unavailable/i);
});

test('with no providers configured the result says AI is not configured', async () => {
  const result = await runAiChain([], INPUT);
  assert.equal(result.provider, 'none');
  assert.equal(result.analysis.status, 'unavailable');
  assert.match(result.analysis.error ?? '', /not configured/i);
});

test('a provider that hangs is abandoned after the timeout', async () => {
  const calls: string[] = [];
  const result = await runAiChain(
    [
      provider('hangs', 'gemini', () => new Promise<AiForensicAnalysis>(() => {}), calls),
      provider('backup', 'gemini_backup', async () => analysis(), calls),
    ],
    INPUT,
    { perProviderTimeoutMs: 40 },
  );
  assert.deepEqual(calls, ['hangs', 'backup']);
  assert.equal(result.provider, 'gemini_backup');
  assert.match(result.attempts[0]?.error ?? '', /timed out/i);
});

// --- Local OpenAI-compatible model (e.g. Jais 2 on our own GPU) --------------

function scanInput(visibleText: string): GeminiAnalysisInput {
  return {
    mode: 'general',
    inputUrl: 'https://tamm-login.xyz/',
    finalUrl: 'https://tamm-login.xyz/',
    tls: { isHttps: true, valid: true } as GeminiAnalysisInput['tls'],
    registration: { domainAgeDays: 3, isNewlyRegistered: true } as GeminiAnalysisInput['registration'],
    redirects: { hopCount: 0, crossDomainRedirect: false, chain: [] } as unknown as GeminiAnalysisInput['redirects'],
    headers: {} as GeminiAnalysisInput['headers'],
    dns: {} as GeminiAnalysisInput['dns'],
    domAndForms: {} as GeminiAnalysisInput['domAndForms'],
    anomalies: { impersonatedBrand: 'TAMM Abu Dhabi' } as GeminiAnalysisInput['anomalies'],
    promptInjection: { detected: false, severity: 'none', findings: [] } as unknown as GeminiAnalysisInput['promptInjection'],
    browser: {
      title: 'TAMM login',
      visibleText,
      metaTags: {},
      jsonLdBlocks: [],
      suspiciousHiddenSnippets: [],
      htmlComments: [],
      ariaAndDataAttrs: [],
      mapReviews: [],
      extractedEmails: [],
      extractedPhones: [],
      socialMessagingLinks: [],
      coordinates: null,
    } as unknown as GeminiAnalysisInput['browser'],
  };
}

const LOCAL_JSON = JSON.stringify({
  aiScamScore: 96,
  confidence: 'high',
  aiDetectedPromptInjection: false,
  promptInjectionEvidence: null,
  impersonatedEntity: 'TAMM',
  provablyFalseOrImpersonatedClaim: true,
  confirmedPhishingOrScam: true,
  summaryEn: 'Fake TAMM login page.',
  summaryAr: 'صفحة دخول مزيفة تنتحل «تم».',
  recommendationEn: 'Do not enter your details.',
  recommendationAr: 'لا تدخل بياناتك.',
  keyFindings: [],
  jobAnalysis: null,
  mapAnalysis: null,
});

test('local provider calls an OpenAI-compatible endpoint and marks the result as backup-grade', async () => {
  const requests: Array<{ url: string; init: RequestInit }> = [];
  const fakeFetch = (async (url: string | URL | Request, init?: RequestInit) => {
    requests.push({ url: String(url), init: init ?? {} });
    return new Response(
      JSON.stringify({ choices: [{ message: { content: LOCAL_JSON } }] }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch;

  const local = createLocalLlmProvider(
    { baseUrl: 'https://gpu.example.test/v1/', model: 'jais-2-8b-chat', apiKey: 'secret-token', timeoutMs: 5000 },
    fakeFetch,
  );
  const result = await local.run(scanInput('Enter your UAE PASS password'));

  assert.equal(requests[0]?.url, 'https://gpu.example.test/v1/chat/completions');
  const headers = new Headers(requests[0]?.init.headers);
  assert.equal(headers.get('authorization'), 'Bearer secret-token');
  const body = JSON.parse(String(requests[0]?.init.body)) as { model: string; messages: unknown[] };
  assert.equal(body.model, 'jais-2-8b-chat');
  assert.equal(body.messages.length, 2);

  assert.equal(local.kind, 'local');
  assert.equal(result.aiScamScore, 96);
  assert.equal(result.model, 'jais-2-8b-chat');
  // No Google Search / Maps lookups happened, and the result must say so.
  assert.equal(result.status, 'degraded');
  assert.deepEqual(result.groundingUsed, []);
  assert.match(result.error ?? '', /live sources/i);
});

test('local provider keeps the prompt inside a small model context window', async () => {
  let sentChars = 0;
  const fakeFetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    sentChars = String(init?.body).length;
    return new Response(JSON.stringify({ choices: [{ message: { content: LOCAL_JSON } }] }), { status: 200 });
  }) as typeof fetch;

  const local = createLocalLlmProvider(
    { baseUrl: 'http://127.0.0.1:8080/v1', model: 'jais', apiKey: null, timeoutMs: 5000, maxPromptChars: 9000 },
    fakeFetch,
  );
  await local.run(scanInput('lorem ipsum '.repeat(20_000)));
  assert.ok(sentChars > 0 && sentChars < 14_000, `request body was ${sentChars} chars`);
});

test('local provider fails loudly on an HTTP error so the chain can move on', async () => {
  const fakeFetch = (async () => new Response('bad gateway', { status: 502 })) as typeof fetch;
  const local = createLocalLlmProvider(
    { baseUrl: 'http://127.0.0.1:8080/v1', model: 'jais', apiKey: null, timeoutMs: 5000 },
    fakeFetch,
  );
  await assert.rejects(() => local.run(scanInput('x')), /502/);
});

test('local provider fails loudly when the model does not return JSON', async () => {
  const fakeFetch = (async () =>
    new Response(JSON.stringify({ choices: [{ message: { content: 'Sure! This site looks fine.' } }] }), {
      status: 200,
    })) as typeof fetch;
  const local = createLocalLlmProvider(
    { baseUrl: 'http://127.0.0.1:8080/v1', model: 'jais', apiKey: null, timeoutMs: 5000 },
    fakeFetch,
  );
  await assert.rejects(() => local.run(scanInput('x')));
});
