import type { AiForensicAnalysis } from '@scamhisn/shared';
import { buildUnavailableAnalysis, type AiChainResult, type AiProvider } from './aiChain.js';
import type { AiAnalysisInput, ResearchNotes } from './types.js';

/**
 * Hybrid pipeline: Gemini is the researcher, the self-hosted model is the judge.
 *
 *   1. Gemini opens the live sources (Google Search / Maps) and reports what it found.
 *   2. The self-hosted model (e.g. Jais 2, UAE-built) reads our telemetry, the page content and
 *      Gemini's research notes, and makes the judgment.
 *
 * Neither is a single point of failure:
 *   - judge down    -> Gemini's own verdict is used
 *   - Gemini down   -> the judge answers alone, marked "live sources not checked"
 *   - both down     -> unavailable; the scan continues on deterministic rules
 */

export interface HybridDeps {
  /** Runs the Gemini fallback chain (all keys and models). */
  research: (input: AiAnalysisInput) => Promise<AiChainResult>;
  /** The self-hosted judge. */
  judge: AiProvider;
}

/** Scores this far apart mean the two models disagree about the basic nature of the page. */
const STRONG_DISAGREEMENT = 40;
/** Below this score both models are saying "no real warning signs". */
const LOW_RISK_CEILING = 45;

function toResearchNotes(research: AiForensicAnalysis): ResearchNotes {
  return {
    researchModel: research.model,
    liveSourcesChecked: research.status === 'completed',
    researcherScamScore: research.aiScamScore,
    summaryEn: research.summaryEn,
    impersonatedEntity: research.impersonatedEntity,
    confirmedPhishingOrScam: research.confirmedPhishingOrScam,
    provablyFalseOrImpersonatedClaim: research.provablyFalseOrImpersonatedClaim,
    keyFindings: research.keyFindings.slice(0, 5).map((kf) => ({
      severity: kf.severity,
      title: kf.titleEn,
      detail: kf.detailEn.slice(0, 280),
    })),
    sources: research.groundingSources.slice(0, 6).map((s) => s.title),
    jobAnalysis: research.jobAnalysis,
    mapAnalysis: research.mapAnalysis,
  };
}

function merge(research: AiForensicAnalysis, judged: AiForensicAnalysis): AiForensicAnalysis {
  const researchScore = research.aiScamScore ?? 0;
  const judgeScore = judged.aiScamScore ?? 0;
  const disagree = Math.abs(researchScore - judgeScore) >= STRONG_DISAGREEMENT;
  // Both call it low risk and the researcher checked live sources: the judge has no additional
  // evidence behind a slightly higher number, so the lower score stands. (Small local models
  // tend to hedge at 20 on perfectly ordinary pages, which would turn "safe" into "caution".)
  const bothLowRisk =
    research.status === 'completed' && researchScore < LOW_RISK_CEILING && judgeScore < LOW_RISK_CEILING;
  const finalScore = disagree
    ? Math.max(researchScore, judgeScore)
    : bothLowRisk
      ? Math.min(researchScore, judgeScore)
      : judgeScore;

  return {
    ...judged,
    // Whether live sources were checked is a fact about the research, not about the judge
    status: research.status,
    error: research.error,
    model: `${judged.model} (judge) + ${research.model} (research)`,
    groundingUsed: research.groundingUsed,
    groundingSources: research.groundingSources,
    // A safety tool resolves a strong disagreement toward caution and says it is unsure
    aiScamScore: finalScore,
    confidence: disagree ? 'low' : judged.confidence,
    // Either model spotting an attack or a confirmed scam is enough
    aiDetectedPromptInjection: judged.aiDetectedPromptInjection || research.aiDetectedPromptInjection,
    promptInjectionEvidence: judged.promptInjectionEvidence ?? research.promptInjectionEvidence,
    confirmedPhishingOrScam: judged.confirmedPhishingOrScam || research.confirmedPhishingOrScam,
    provablyFalseOrImpersonatedClaim:
      judged.provablyFalseOrImpersonatedClaim || research.provablyFalseOrImpersonatedClaim,
    impersonatedEntity: judged.impersonatedEntity ?? research.impersonatedEntity,
    keyFindings: judged.keyFindings.length > 0 ? judged.keyFindings : research.keyFindings,
    // Verified facts about an employer or a map listing can only come from live lookups
    jobAnalysis: research.jobAnalysis,
    mapAnalysis: research.mapAnalysis,
  };
}

export async function runHybridAnalysis(deps: HybridDeps, input: AiAnalysisInput): Promise<AiChainResult> {
  const research = await deps.research(input);
  const geminiAnswered = research.provider !== 'none' && research.analysis.status !== 'unavailable';
  const attempts = [...research.attempts];

  const runJudge = async (judgeInput: AiAnalysisInput): Promise<AiForensicAnalysis | null> => {
    const startedAt = Date.now();
    try {
      const judged = await deps.judge.run(judgeInput);
      attempts.push({
        id: deps.judge.id,
        kind: deps.judge.kind,
        model: deps.judge.model,
        ok: true,
        error: null,
        durationMs: Date.now() - startedAt,
      });
      return judged;
    } catch (err) {
      const message = (err instanceof Error ? err.message : String(err)).replace(/\s+/g, ' ').slice(0, 300);
      attempts.push({
        id: deps.judge.id,
        kind: deps.judge.kind,
        model: deps.judge.model,
        ok: false,
        error: message,
        durationMs: Date.now() - startedAt,
      });
      console.warn(`[ScamHisn AI chain] ${deps.judge.id} failed: ${message}`);
      return null;
    }
  };

  if (geminiAnswered) {
    const judged = await runJudge({ ...input, research: toResearchNotes(research.analysis) });
    if (judged) {
      return { analysis: merge(research.analysis, judged), provider: 'hybrid', attempts };
    }
    // Judge unreachable: Gemini's own verdict stands
    return { analysis: research.analysis, provider: research.provider, attempts };
  }

  // Gemini unreachable: the judge works from the page and telemetry alone
  const judged = await runJudge(input);
  if (judged) {
    return { analysis: judged, provider: 'local', attempts };
  }

  const last = attempts[attempts.length - 1];
  return {
    analysis: buildUnavailableAnalysis(
      `Gemini and the self-hosted model both failed. Last error: ${last?.error ?? 'unknown'}`,
      { model: research.analysis.model, configured: true },
    ),
    provider: 'none',
    attempts,
  };
}
