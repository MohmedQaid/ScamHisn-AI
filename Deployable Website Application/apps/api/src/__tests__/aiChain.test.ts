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

// --- A reply cut off by the token limit still yields the verdict -------------

test('a reply truncated inside keyFindings is salvaged up to the last complete field', async () => {
  const { salvageJsonObject } = await import('../ai/localLlmProvider.js');
  const truncated =
    '{"aiScamScore": 12, "confidence": "high", "summaryEn": "Official site, braces } and \\"quotes\\" inside.", "summaryAr": "موقع رسمي", "keyFindings": [{"severity": "info", "titleEn": "Valid certificate", "titleAr": "شهادة صالحة"}, {"severity": "low", "titleEn": "Missing hea';
  const obj = salvageJsonObject(truncated) as Record<string, unknown>;
  assert.equal(obj.aiScamScore, 12);
  assert.equal(obj.summaryAr, 'موقع رسمي');
  assert.equal(obj.summaryEn, 'Official site, braces } and "quotes" inside.');
  // The half-written array is dropped rather than guessed at
  assert.equal(obj.keyFindings, undefined);
});

test('a complete reply is parsed as it is, even with prose around it', async () => {
  const { salvageJsonObject } = await import('../ai/localLlmProvider.js');
  const obj = salvageJsonObject('Here you go:\n```json\n{"aiScamScore": 90, "keyFindings": []}\n```') as Record<string, unknown>;
  assert.equal(obj.aiScamScore, 90);
  assert.deepEqual(obj.keyFindings, []);
});

test('text with no usable JSON is rejected', async () => {
  const { salvageJsonObject } = await import('../ai/localLlmProvider.js');
  assert.throws(() => salvageJsonObject('Sure! This site looks fine.'));
  assert.throws(() => salvageJsonObject('{"aiScamSc'));
});

test('local provider returns a verdict when the model reply is cut off mid-array', async () => {
  const cutOff =
    '{"aiScamScore": 8, "confidence": "high", "aiDetectedPromptInjection": false, "promptInjectionEvidence": null, "impersonatedEntity": null, "provablyFalseOrImpersonatedClaim": false, "confirmedPhishingOrScam": false, "summaryEn": "Genuine police portal.", "summaryAr": "بوابة رسمية.", "recommendationEn": "Safe to use.", "recommendationAr": "آمن.", "keyFindings": [{"severity": "info", "titleEn": "Old dom';
  const fakeFetch = (async () =>
    new Response(JSON.stringify({ choices: [{ finish_reason: 'length', message: { content: cutOff } }] }), {
      status: 200,
    })) as typeof fetch;
  const local = createLocalLlmProvider(
    { baseUrl: 'http://127.0.0.1:8080/v1', model: 'falcon', apiKey: null, timeoutMs: 5000 },
    fakeFetch,
  );
  const result = await local.run(scanInput('x'));
  assert.equal(result.aiScamScore, 8);
  assert.equal(result.summaryAr, 'بوابة رسمية.');
  assert.deepEqual(result.keyFindings, []);
});

// --- "Live sources checked" must mean a lookup really happened --------------

test('a reply with cited sources or search queries counts as a live lookup', async () => {
  const { liveLookupHappened } = await import('../ai/geminiAnalyzer.js');
  assert.equal(liveLookupHappened({ candidates: [{ groundingMetadata: { groundingChunks: [{ web: { uri: 'https://x' } }] } }] }), true);
  assert.equal(liveLookupHappened({ candidates: [{ groundingMetadata: { webSearchQueries: ['adpolice official site'] } }] }), true);
});

test('a reply from a model that had search but did not use it does not count', async () => {
  const { liveLookupHappened } = await import('../ai/geminiAnalyzer.js');
  assert.equal(liveLookupHappened({ candidates: [{ groundingMetadata: {} }] }), false);
  assert.equal(liveLookupHappened({ candidates: [{}] }), false);
  assert.equal(liveLookupHappened({}), false);
});

// --- Errors that will not fix themselves are told apart from "try again soon" ---

test('"model not available to this account" and bad keys are permanent', async () => {
  const { isPermanentAiError, isTransientAiError } = await import('../ai/aiChain.js');
  // Real message seen from Google on 24 Nov 2026
  const gone =
    '{"error":{"code":404,"message":"This model models/gemini-2.5-flash-lite is no longer available to new users."}}';
  assert.equal(isPermanentAiError(gone), true);
  assert.equal(isPermanentAiError('{"error":{"code":400,"message":"API key not valid. Please pass a valid API key.","status":"INVALID_ARGUMENT"}}'), true);
  assert.equal(isPermanentAiError('403 PERMISSION_DENIED'), true);
  assert.equal(isTransientAiError(gone), false);
});

test('quota and overload errors are temporary, not permanent', async () => {
  const { isPermanentAiError, isTransientAiError } = await import('../ai/aiChain.js');
  const quota = '{"error":{"code":429,"message":"You exceeded your current quota","status":"RESOURCE_EXHAUSTED"}}';
  assert.equal(isPermanentAiError(quota), false);
  assert.equal(isTransientAiError(quota), true);
  assert.equal(isPermanentAiError('503 UNAVAILABLE: high demand'), false);
});

test('"quota exceeded" is told apart from "model overloaded"', async () => {
  const { isQuotaError } = await import('../ai/aiChain.js');
  assert.equal(isQuotaError('{"error":{"code":429,"message":"You exceeded your current quota","status":"RESOURCE_EXHAUSTED"}}'), true);
  assert.equal(isQuotaError('{"error":{"code":503,"message":"This model is currently experiencing high demand.","status":"UNAVAILABLE"}}'), false);
  assert.equal(isQuotaError('fetch failed'), false);
});
