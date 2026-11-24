import test from 'node:test';
import assert from 'node:assert/strict';
import type { AiForensicAnalysis } from '@scamhisn/shared';
import { RefusalMemo } from '../ai/refusalMemo.js';
import { computeCapabilities } from '../ai/availability.js';
import { runHybridAnalysis } from '../ai/hybridPipeline.js';
import type { AiChainResult, AiProvider } from '../ai/aiChain.js';
import type { AiAnalysisInput } from '../ai/types.js';

// --- Cool-down bookkeeping ---------------------------------------------------

test('the memo reports when a cool-down ends', () => {
  let now = 10_000;
  const memo = new RefusalMemo(120_000, () => now);
  assert.equal(memo.until('gemini:key1:m', 'quota'), null);
  memo.remember('gemini:key1:m', 'quota');
  assert.equal(memo.until('gemini:key1:m', 'quota'), 130_000);
  now = 130_001;
  assert.equal(memo.until('gemini:key1:m', 'quota'), null);
});

// --- Which features can run right now ---------------------------------------

const NOW = Date.parse('2026-11-24T20:00:00.000Z');

function caps(coolingUntil: Record<string, number>, ids = ['gemini:key1:m', 'gemini:key2:m'], local = true) {
  return computeCapabilities({
    geminiProviderIds: ids,
    coolingUntil: (id) => coolingUntil[id] ?? null,
    localModel: local ? 'jais-2-8b-chat' : null,
    pipeline: 'hybrid',
    now: NOW,
  });
}

test('with a healthy Gemini key every feature is available', () => {
  const c = caps({});
  assert.equal(c.geminiAvailable, true);
  for (const f of ['general', 'job', 'map', 'image'] as const) {
    assert.equal(c.features[f].available, true, f);
    assert.equal(c.features[f].reason, 'ok');
  }
});

test('one exhausted key does not switch anything off while the other still works', () => {
  const c = caps({ 'gemini:key1:m': NOW + 60_000 });
  assert.equal(c.geminiAvailable, true);
  assert.equal(c.features.map.available, true);
});

test('when both keys are exhausted, Job, Map and Image switch off until the earliest cool-down ends', () => {
  const c = caps({ 'gemini:key1:m': NOW + 90_000, 'gemini:key2:m': NOW + 30_000 });
  assert.equal(c.geminiAvailable, false);
  const expectedRetry = new Date(NOW + 30_000).toISOString();
  assert.equal(c.geminiRetryAt, expectedRetry);
  for (const f of ['job', 'map', 'image'] as const) {
    assert.equal(c.features[f].available, false, f);
    assert.equal(c.features[f].reason, 'gemini_cooling_down');
    assert.equal(c.features[f].retryAt, expectedRetry);
  }
});

test('general link checks stay available with Gemini down (local model, then rules)', () => {
  const c = caps({ 'gemini:key1:m': NOW + 90_000, 'gemini:key2:m': NOW + 30_000 });
  assert.equal(c.features.general.available, true);
});

test('with no Gemini key at all, Gemini-only features are off and say why', () => {
  const c = caps({}, [], false);
  assert.equal(c.geminiConfigured, false);
  assert.equal(c.features.image.available, false);
  assert.equal(c.features.image.reason, 'gemini_not_configured');
  assert.equal(c.features.image.retryAt, null);
  assert.equal(c.features.general.available, true);
});

// --- Hybrid: Gemini gathers the evidence, the local model judges -------------

function analysis(overrides: Partial<AiForensicAnalysis> = {}): AiForensicAnalysis {
  return {
    status: 'completed',
    error: null,
    model: 'gemini-x',
    groundingUsed: ['google_search'],
    groundingSources: [{ title: 'Official site', uri: 'https://example.ae', sourceType: 'web' }],
    aiScamScore: 10,
    confidence: 'high',
    aiDetectedPromptInjection: false,
    promptInjectionEvidence: null,
    impersonatedEntity: null,
    provablyFalseOrImpersonatedClaim: false,
    confirmedPhishingOrScam: false,
    summaryEn: 'Research summary.',
    summaryAr: 'ملخص البحث.',
    recommendationEn: 'r',
    recommendationAr: 'ر',
    keyFindings: [],
    jobAnalysis: null,
    mapAnalysis: null,
    ...overrides,
  };
}

const INPUT = { mode: 'general' } as AiAnalysisInput;

function researchResult(a: AiForensicAnalysis | null): () => Promise<AiChainResult> {
  return async () =>
    a
      ? { analysis: a, provider: 'gemini', attempts: [] }
      : {
          analysis: analysis({ status: 'unavailable', aiScamScore: null, groundingUsed: [], model: 'gemini-x' }),
          provider: 'none',
          attempts: [],
        };
}

function judge(
  behaviour: (input: AiAnalysisInput) => Promise<AiForensicAnalysis>,
  seen: AiAnalysisInput[] = [],
): AiProvider {
  return {
    id: 'local:jais',
    kind: 'local',
    model: 'jais-2-8b-chat',
    run: async (input) => {
      seen.push(input);
      return behaviour(input);
    },
  };
}

test('hybrid: the local model judges using the research Gemini gathered', async () => {
  const seen: AiAnalysisInput[] = [];
  const result = await runHybridAnalysis(
    {
      research: researchResult(analysis({ aiScamScore: 12, summaryEn: 'Domain is the official TAMM portal.' })),
      judge: judge(
        async () =>
          analysis({ status: 'degraded', model: 'jais-2-8b-chat', groundingUsed: [], groundingSources: [], aiScamScore: 8, summaryEn: 'Judge summary.' }),
        seen,
      ),
    },
    INPUT,
  );

  assert.equal(result.provider, 'hybrid');
  // The judge was handed the research notes
  assert.equal(seen[0]?.research?.summaryEn, 'Domain is the official TAMM portal.');
  // The judgment is the local model's ...
  assert.equal(result.analysis.aiScamScore, 8);
  assert.equal(result.analysis.summaryEn, 'Judge summary.');
  // ... while the live-source evidence is Gemini's
  assert.equal(result.analysis.status, 'completed');
  assert.deepEqual(result.analysis.groundingUsed, ['google_search']);
  assert.equal(result.analysis.groundingSources.length, 1);
  assert.match(result.analysis.model, /jais-2-8b-chat/);
  assert.match(result.analysis.model, /gemini-x/);
});

test('hybrid: if the local model is down, Gemini answers alone', async () => {
  const result = await runHybridAnalysis(
    {
      research: researchResult(analysis({ aiScamScore: 91 })),
      judge: judge(async () => {
        throw new Error('fetch failed');
      }),
    },
    INPUT,
  );
  assert.equal(result.provider, 'gemini');
  assert.equal(result.analysis.aiScamScore, 91);
});

test('hybrid: if Gemini is down, the local model answers alone and says live sources were not checked', async () => {
  const seen: AiAnalysisInput[] = [];
  const result = await runHybridAnalysis(
    {
      research: researchResult(null),
      judge: judge(
        async () => analysis({ status: 'degraded', model: 'jais-2-8b-chat', groundingUsed: [], groundingSources: [], aiScamScore: 70 }),
        seen,
      ),
    },
    INPUT,
  );
  assert.equal(result.provider, 'local');
  assert.equal(seen[0]?.research, undefined);
  assert.equal(result.analysis.status, 'degraded');
});

test('hybrid: if both are down the result is unavailable', async () => {
  const result = await runHybridAnalysis(
    {
      research: researchResult(null),
      judge: judge(async () => {
        throw new Error('502');
      }),
    },
    INPUT,
  );
  assert.equal(result.provider, 'none');
  assert.equal(result.analysis.status, 'unavailable');
});

test('hybrid: on a strong disagreement the more cautious score wins', async () => {
  const result = await runHybridAnalysis(
    {
      research: researchResult(analysis({ aiScamScore: 92, confirmedPhishingOrScam: true })),
      judge: judge(async () => analysis({ status: 'degraded', model: 'jais', aiScamScore: 15 })),
    },
    INPUT,
  );
  assert.equal(result.analysis.aiScamScore, 92);
  assert.equal(result.analysis.confirmedPhishingOrScam, true);
  assert.equal(result.analysis.confidence, 'low');
});

test('hybrid: verified job and map facts come from the research, not from the offline judge', async () => {
  const job = {
    linkLegitimate: true,
    jobAuthenticityScore: 90,
    companyVerified: true,
    companyName: 'Example LLC',
    verificationNotesEn: 'Found on the official careers site.',
    verificationNotesAr: '',
    redFlagsEn: [],
    redFlagsAr: [],
  };
  const result = await runHybridAnalysis(
    {
      research: researchResult(analysis({ jobAnalysis: job })),
      judge: judge(async () =>
        analysis({ status: 'degraded', model: 'jais', jobAnalysis: { ...job, companyVerified: false, jobAuthenticityScore: 40 } }),
      ),
    },
    { mode: 'job' } as AiAnalysisInput,
  );
  assert.equal(result.analysis.jobAnalysis?.companyVerified, true);
  assert.equal(result.analysis.jobAnalysis?.jobAuthenticityScore, 90);
});

test('hybrid: when grounded research and the judge both see low risk, the lower score stands', async () => {
  const result = await runHybridAnalysis(
    {
      research: researchResult(analysis({ status: 'completed', aiScamScore: 5 })),
      judge: judge(async () => analysis({ status: 'degraded', model: 'falcon', aiScamScore: 20 })),
    },
    INPUT,
  );
  assert.equal(result.analysis.aiScamScore, 5);
});

test('hybrid: a judge that raises the score into real risk is respected', async () => {
  const result = await runHybridAnalysis(
    {
      research: researchResult(analysis({ status: 'completed', aiScamScore: 30 })),
      judge: judge(async () => analysis({ status: 'degraded', model: 'falcon', aiScamScore: 60 })),
    },
    INPUT,
  );
  assert.equal(result.analysis.aiScamScore, 60);
});
