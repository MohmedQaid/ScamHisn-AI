import test from 'node:test';
import assert from 'node:assert/strict';
import { combineImageScores, judgeImageExtraction, type ImageExtraction } from '../ai/imageJudge.js';

const EXTRACTION: ImageExtraction = {
  transcribedText: 'شرطة أبوظبي: لديك مخالفة غير مدفوعة 150 درهماً. ادفع الآن عبر adpolice-fines.top',
  impersonatedEntity: 'Abu Dhabi Police',
  extractedUrls: ['adpolice-fines.top'],
  extractedPhones: [],
  readerSummaryEn: 'SMS screenshot demanding payment of a traffic fine through an unofficial link.',
  readerNotesEn: 'Layout resembles a standard SMS thread.',
  readerScamScore: 92,
  visualPromptInjectionDetected: false,
};

const CFG = { baseUrl: 'http://127.0.0.1:8080/v1', model: 'jais-2-8b-chat', apiKey: 'k', timeoutMs: 5000 };

test('the local judge receives the text Gemini read from the image and returns a verdict', async () => {
  let sentBody = '';
  const fakeFetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    sentBody = String(init?.body);
    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                scamScore: 96,
                summaryEn: 'Fake fine message using a look-alike link.',
                summaryAr: 'رسالة مخالفة مزيفة برابط مقلّد.',
              }),
            },
          },
        ],
      }),
      { status: 200 },
    );
  }) as typeof fetch;

  const judged = await judgeImageExtraction(CFG, EXTRACTION, fakeFetch);
  assert.equal(judged.scamScore, 96);
  assert.equal(judged.summaryAr, 'رسالة مخالفة مزيفة برابط مقلّد.');
  // The transcription and the extracted link reached the judge
  assert.ok(sentBody.includes('adpolice-fines.top'));
  assert.ok(sentBody.includes('150'));
});

test('an unusable reply from the judge is an error, so the caller keeps Gemini\'s verdict', async () => {
  const fakeFetch = (async () =>
    new Response(JSON.stringify({ choices: [{ message: { content: 'It looks suspicious.' } }] }), {
      status: 200,
    })) as typeof fetch;
  await assert.rejects(() => judgeImageExtraction(CFG, EXTRACTION, fakeFetch));
});

test('the judge is not called when Gemini read no text from the image', async () => {
  let called = false;
  const fakeFetch = (async () => {
    called = true;
    return new Response('{}', { status: 200 });
  }) as typeof fetch;
  await assert.rejects(() => judgeImageExtraction(CFG, { ...EXTRACTION, transcribedText: '  ' }, fakeFetch));
  assert.equal(called, false);
});

test('scores are combined cautiously', () => {
  // Close together: the judge decides
  assert.equal(combineImageScores(80, 90), 90);
  assert.equal(combineImageScores(30, 20), 20);
  // Far apart: the more cautious one wins
  assert.equal(combineImageScores(92, 15), 92);
  assert.equal(combineImageScores(10, 85), 85);
});
