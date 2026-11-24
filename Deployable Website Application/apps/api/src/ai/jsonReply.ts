/**
 * Helpers for models that answer in free text instead of schema-constrained JSON:
 * self-hosted models, and Gemini when live-lookup tools are on (some Gemini models refuse
 * tools together with a JSON response type).
 */

/** The reply shape, spelled out for models that are not given a response schema. */
export const JSON_REPLY_SHAPE = `Respond with ONE JSON object and nothing else (no prose, no markdown fences), using exactly these keys:
{"aiScamScore": 0-100 integer, "confidence": "high"|"medium"|"low", "aiDetectedPromptInjection": boolean, "promptInjectionEvidence": string|null, "impersonatedEntity": string|null, "provablyFalseOrImpersonatedClaim": boolean, "confirmedPhishingOrScam": boolean, "summaryEn": string, "summaryAr": string, "recommendationEn": string, "recommendationAr": string, "keyFindings": [{"severity": "critical"|"high"|"medium"|"low"|"info", "titleEn": string, "titleAr": string, "detailEn": string, "detailAr": string}], "jobAnalysis": object|null, "mapAnalysis": object|null}
Keep summaries to one or two sentences, every other string under 160 characters, and return at most 3 keyFindings.`;

/** Field lists for the two mode-specific objects, for models without a response schema. */
export const JOB_MAP_SHAPE = `When jobAnalysis is not null it must be: {"linkLegitimate": boolean, "jobAuthenticityScore": 0-100 integer, "companyVerified": boolean, "companyName": string|null, "verificationNotesEn": string, "verificationNotesAr": string, "redFlagsEn": string[], "redFlagsAr": string[]}
When mapAnalysis is not null it must be: {"placeVerified": boolean, "placeName": string|null, "businessExistsOnExternalSources": boolean, "contactHijackingSuspected": boolean, "reviewInjectionOrScamLinksFound": boolean, "verificationNotesEn": string, "verificationNotesAr": string}`;

/**
 * Parses the JSON object in a reply that may be wrapped in fences or prose, or cut off by the
 * token limit. Arabic text costs many more tokens per character than English, so a reply about
 * an Arabic page can run out of room inside the last field (usually keyFindings).
 *
 * When the reply is cut off, everything up to the last COMPLETE top-level field is kept and the
 * half-written field is dropped. The verdict fields come first in the reply, so the score and the
 * summaries survive; nothing is invented.
 */
export function salvageJsonObject(content: string): unknown {
  const start = content.indexOf('{');
  if (start === -1) {
    throw new Error('Model did not return a JSON object');
  }
  const text = content.slice(start);

  let depth = 0;
  let inString = false;
  let escaped = false;
  let lastCompleteField = -1; // index of the comma that follows the last complete top-level field
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 0) {
        // Complete object: parse it as it is (ignoring anything after the closing brace)
        return JSON.parse(text.slice(0, i + 1));
      }
    } else if (ch === ',' && depth === 1) {
      lastCompleteField = i;
    }
  }

  if (lastCompleteField === -1) {
    throw new Error('Model reply was cut off before any complete field');
  }
  return JSON.parse(`${text.slice(0, lastCompleteField)}}`);
}
