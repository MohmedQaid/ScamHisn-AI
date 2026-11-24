import test from 'node:test';
import assert from 'node:assert/strict';
import type { AiForensicAnalysis } from '@scamhisn/shared';
import { arabicWasRepaired, hasForeignScript, repairArabic, stripForeignScript } from '../ai/textQuality.js';
import { runHybridAnalysis } from '../ai/hybridPipeline.js';
import type { AiAnalysisInput } from '../ai/types.js';

// Real output seen from Falcon-H1 7B (4-bit) on 24 Nov 2026
const GLITCHED = 'وهي ممارسة شائعة لأغراض التранзак션 الآمنة. لا توجد روابط مشبوهة.';

test('stray Cyrillic, CJK or Hangul inside Arabic text is detected', () => {
  assert.equal(hasForeignScript(GLITCHED), true);
  assert.equal(hasForeignScript('نقص المعلومات联系方式 يثير الشك'), true);
});

test('clean Arabic with Latin brand names and digits is left alone', () => {
  const clean = 'الرابط ينتحل UAE PASS وعمر النطاق 3 أيام فقط.';
  assert.equal(hasForeignScript(clean), false);
  assert.equal(stripForeignScript(clean), clean);
});

test('the stray characters are removed without leaving gaps before punctuation', () => {
  const fixed = stripForeignScript(GLITCHED);
  assert.equal(hasForeignScript(fixed), false);
  assert.ok(!/\s[.،]/.test(fixed), fixed);
});

function analysis(overrides: Partial<AiForensicAnalysis> = {}): AiForensicAnalysis {
  return {
    status: 'completed',
    error: null,
    model: 'gemini-x',
    groundingUsed: ['google_search'],
    groundingSources: [],
    aiScamScore: 10,
    confidence: 'high',
    aiDetectedPromptInjection: false,
    promptInjectionEvidence: null,
    impersonatedEntity: null,
    provablyFalseOrImpersonatedClaim: false,
    confirmedPhishingOrScam: false,
    summaryEn: 'Research summary.',
    summaryAr: 'ملخص الباحث بعربية سليمة.',
    recommendationEn: 'r',
    recommendationAr: 'توصية الباحث.',
    keyFindings: [],
    jobAnalysis: null,
    mapAnalysis: null,
    ...overrides,
  };
}

test('repairArabic cleans every Arabic field and records that it did', () => {
  const dirty = analysis({ summaryAr: GLITCHED, keyFindings: [{ severity: 'low', titleEn: 't', titleAr: 'عنوان 联系', detailEn: 'd', detailAr: 'تفصيل' }] });
  const fixed = repairArabic(dirty);
  assert.equal(hasForeignScript(fixed.summaryAr), false);
  assert.equal(hasForeignScript(fixed.keyFindings[0]!.titleAr), false);
  assert.equal(arabicWasRepaired(fixed), true);
  // Untouched replies are returned as they are
  const clean = analysis();
  assert.equal(repairArabic(clean), clean);
  assert.equal(arabicWasRepaired(clean), false);
});

test('hybrid: when the judge garbles its Arabic, the researcher\'s Arabic is shown instead', async () => {
  const result = await runHybridAnalysis(
    {
      research: async () => ({ analysis: analysis(), provider: 'gemini', attempts: [] }),
      judge: {
        id: 'local:falcon',
        kind: 'local',
        model: 'falcon',
        run: async () =>
          repairArabic(analysis({ status: 'degraded', model: 'falcon', summaryEn: 'Judge summary.', summaryAr: GLITCHED })),
      },
    },
    { mode: 'general' } as AiAnalysisInput,
  );
  assert.equal(result.analysis.summaryEn, 'Judge summary.');
  assert.equal(result.analysis.summaryAr, 'ملخص الباحث بعربية سليمة.');
  assert.equal(result.analysis.recommendationAr, 'توصية الباحث.');
});
