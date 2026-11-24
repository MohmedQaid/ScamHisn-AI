import type { AiForensicAnalysis } from '@scamhisn/shared';

/**
 * Small self-hosted models occasionally drop a few characters from another script (Cyrillic,
 * CJK, Hangul) into Arabic output. Seen with Falcon-H1 7B at 4-bit: "التранзак션 الآمنة".
 * Such text must not reach a user, so it is repaired here and, in hybrid mode, replaced by the
 * researcher's Arabic when that is available.
 */
const FOREIGN_SCRIPT = /[Ѐ-ԯ぀-ヿ㐀-䶿一-鿿가-힯ऀ-ॿ฀-๿]/;
const FOREIGN_SCRIPT_RUN = /[Ѐ-ԯ぀-ヿ㐀-䶿一-鿿가-힯ऀ-ॿ฀-๿]+/g;

export function hasForeignScript(text: string): boolean {
  return FOREIGN_SCRIPT.test(text);
}

export function stripForeignScript(text: string): string {
  return text
    .replace(FOREIGN_SCRIPT_RUN, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,،؛:!؟])/g, '$1')
    .trim();
}

const repaired = new WeakSet<AiForensicAnalysis>();

/** True when this analysis had stray foreign-script characters removed from its Arabic text. */
export function arabicWasRepaired(analysis: AiForensicAnalysis): boolean {
  return repaired.has(analysis);
}

/** Removes stray foreign-script characters from every Arabic field of a model reply. */
export function repairArabic(analysis: AiForensicAnalysis): AiForensicAnalysis {
  const dirty =
    hasForeignScript(analysis.summaryAr) ||
    hasForeignScript(analysis.recommendationAr) ||
    analysis.keyFindings.some((kf) => hasForeignScript(kf.titleAr) || hasForeignScript(kf.detailAr));
  if (!dirty) return analysis;

  const fixed: AiForensicAnalysis = {
    ...analysis,
    summaryAr: stripForeignScript(analysis.summaryAr),
    recommendationAr: stripForeignScript(analysis.recommendationAr),
    keyFindings: analysis.keyFindings.map((kf) => ({
      ...kf,
      titleAr: stripForeignScript(kf.titleAr),
      detailAr: stripForeignScript(kf.detailAr),
    })),
  };
  repaired.add(fixed);
  return fixed;
}
