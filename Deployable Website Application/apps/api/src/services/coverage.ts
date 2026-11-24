import type {
  AiForensicAnalysis,
  AiProviderKind,
  AnalysisCoverage,
  VerdictLevel,
} from '@scamhisn/shared';

export interface CoverageInput {
  domainResolved: boolean;
  pageLoaded: boolean;
  aiStatus: AiForensicAnalysis['status'];
  aiProvider: AiProviderKind;
  aiModel: string | null;
}

/**
 * States plainly how much of the analysis ran, so no surface (web, extension, PDF)
 * can present a partial check as a clean bill of health.
 */
export function determineCoverage(input: CoverageInput): AnalysisCoverage {
  const aiAnswered = input.aiStatus !== 'unavailable' && input.aiProvider !== 'none';
  const liveSourcesChecked = aiAnswered && input.aiStatus === 'completed';

  let level: AnalysisCoverage['level'];
  if (!input.domainResolved) {
    level = 'address_only';
  } else if (!aiAnswered) {
    level = 'rules_only';
  } else if (!input.pageLoaded || !liveSourcesChecked) {
    level = 'partial';
  } else {
    level = 'full';
  }

  return {
    level,
    domainResolved: input.domainResolved,
    pageLoaded: input.pageLoaded,
    aiProvider: aiAnswered ? input.aiProvider : 'none',
    aiModel: aiAnswered ? input.aiModel : null,
    liveSourcesChecked,
  };
}

/**
 * "Safe" is only ever stated when the page was actually opened AND an AI model judged it.
 * Otherwise a clean technical result is downgraded to "caution". Never relaxes a verdict.
 */
export function guardVerdict(verdict: VerdictLevel, coverage: AnalysisCoverage): VerdictLevel {
  if (verdict !== 'safe') return verdict;
  const aiAnswered = coverage.aiProvider !== 'none';
  return coverage.pageLoaded && aiAnswered ? 'safe' : 'caution';
}
