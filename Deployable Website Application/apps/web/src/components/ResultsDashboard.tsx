import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileDown,
  Info,
  Loader2,
  Send,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import type { ScanResponse, Severity, VerdictLevel } from '@scamhisn/shared';
import { useLocale } from '../i18n/LocaleContext';
import { downloadForensicReportPdf } from '../api/client';
import { RiskGauge } from './RiskGauge';
import { PromptInjectionBanner } from './PromptInjectionBanner';
import { ModeInsightsCard } from './ModeInsightsCard';
import { TechnicalChecksGrid } from './TechnicalChecksGrid';
import { GroundingSources } from './GroundingSources';
import { RawMetadataViewer } from './RawMetadataViewer';

interface ResultsDashboardProps {
  result: ScanResponse;
}

const VERDICT_BADGE: Record<VerdictLevel, string> = {
  safe: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/60 dark:text-emerald-300',
  caution:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/60 dark:text-amber-300',
  suspicious:
    'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-500/30 dark:bg-orange-950/60 dark:text-orange-300',
  high_risk:
    'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/35 dark:bg-rose-950/60 dark:text-rose-300',
  confirmed_scam:
    'border-rose-400 bg-rose-600 text-white shadow-xs shadow-rose-900/20 dark:border-rose-400/60 dark:bg-rose-600 dark:text-white',
};

const SEVERITY_BADGE: Record<Severity, string> = {
  critical: 'bg-rose-600 text-white',
  high: 'bg-orange-600 text-white',
  medium: 'bg-amber-500/20 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  low: 'bg-sky-500/15 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300',
  info: 'bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export function ResultsDashboard({ result }: ResultsDashboardProps) {
  const { locale, t } = useLocale();
  const [showDetails, setShowDetails] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [showPoliceConcept, setShowPoliceConcept] = useState(false);

  const verdictMeta = t.verdicts[result.verdict];
  const aiSummary = locale === 'ar' ? result.aiAnalysis.summaryAr : result.aiAnalysis.summaryEn;

  // How much of the analysis ran. Older API responses have no coverage field: infer it.
  const coverageLevel =
    result.coverage?.level ?? (result.aiAnalysis.status === 'unavailable' ? 'rules_only' : 'full');
  const pageLoaded = result.coverage?.pageLoaded ?? result.technicalChecks.domAndForms.browserCaptured;
  const coverageText =
    coverageLevel === 'address_only'
      ? t.coverage.addressOnly
      : coverageLevel === 'rules_only'
        ? t.coverage.rulesOnly
        : coverageLevel === 'partial'
          ? pageLoaded
            ? t.coverage.partialBackup
            : t.coverage.partialPageNotLoaded
          : t.coverage.full;
  const isFullCoverage = coverageLevel === 'full';

  // A clean technical result without AI is "incomplete", never a confident verdict
  const isIncompleteCheck =
    (coverageLevel === 'rules_only' || coverageLevel === 'address_only') && result.scamScore <= 19;
  const verdictLabel = isIncompleteCheck ? t.coverage.incompleteLabel : verdictMeta.label;

  // When the AI did not answer and the rules found real risk, lead with the verdict text;
  // otherwise show the summary (which now says plainly when AI was unavailable).
  const aiUnavailable = result.aiAnalysis.status === 'unavailable';
  const displayHeadlineText =
    aiUnavailable && coverageLevel !== 'address_only' && result.scamScore >= 45
      ? verdictMeta.desc
      : aiSummary || verdictMeta.desc;

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    setPdfError(null);
    try {
      await downloadForensicReportPdf(result, locale);
    } catch {
      setPdfError(t.actions.reportError);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="mx-auto mt-6 w-full max-w-4xl space-y-4">
      {/* Critical Smoking-Gun & Prompt-Injection Alerts always visible immediately */}
      <PromptInjectionBanner
        promptInjection={result.promptInjection}
        aiDetectedPromptInjection={result.aiAnalysis.aiDetectedPromptInjection}
        aiEvidence={result.aiAnalysis.promptInjectionEvidence}
        smokingGuns={result.smokingGunsTriggered}
      />

      {/* Minimal End-User Verdict Card */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-5 shadow-lg shadow-slate-900/[0.04] backdrop-blur-md dark:border-slate-800 dark:bg-[#0e161e]/95 dark:shadow-black/40">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5">
          {/* Compact Percentage Ring */}
          <RiskGauge score={result.scamScore} verdict={result.verdict} />

          {/* Clean Verdict & Concise Summary */}
          <div className="w-full min-w-0 flex-1 text-center sm:text-start">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-extrabold ${VERDICT_BADGE[result.verdict]}`}
              >
                {verdictLabel}
              </span>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                {t.scamLikelihoodLabel}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {t.modes[result.mode].label}
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                <Clock className="h-3 w-3" />
                {(result.durationMs / 1000).toFixed(1)}s
              </span>
            </div>

            <p className="mt-2 break-words text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              {displayHeadlineText}
            </p>

            {/* Coverage: say plainly how much of the analysis ran */}
            <p
              className={`mt-2 inline-flex items-start gap-1.5 rounded-xl px-2.5 py-1.5 text-start text-[11.5px] font-medium leading-snug ${
                isFullCoverage
                  ? 'bg-emerald-50/80 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border border-amber-300/80 bg-amber-50 text-amber-900 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-200'
              }`}
            >
              {isFullCoverage ? (
                <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0" />
              ) : (
                <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
              )}
              <span>{coverageText}</span>
            </p>

            <p
              dir="ltr"
              className="mt-2 block w-full truncate font-mono text-xs text-slate-500 dark:text-slate-400"
              title={result.finalUrl}
            >
              {result.finalUrl}
            </p>
          </div>
        </div>

        {/* Action Strip: Show Details + Generate Report (PDF) + Send to Police (Concept) */}
        <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            aria-expanded={showDetails}
            className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50 px-3.5 text-xs font-bold text-slate-700 transition-colors hover:border-emerald-500/50 hover:bg-emerald-50/50 hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-400/50 dark:hover:text-emerald-300"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{showDetails ? t.actions.hideDetails : t.actions.showDetails}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                showDetails ? 'rotate-180' : ''
              }`}
            />
          </button>

          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
            className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00734B] via-[#059669] to-[#047857] px-4 text-xs font-bold text-white shadow-sm shadow-emerald-900/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 dark:from-emerald-600 dark:via-emerald-500 dark:to-teal-500 dark:text-slate-950"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{t.actions.generatingReport}</span>
              </>
            ) : (
              <>
                <FileDown className="h-3.5 w-3.5" />
                <span>{t.actions.generateReport}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowPoliceConcept((prev) => !prev)}
            className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-rose-300/80 bg-rose-50/70 px-3.5 text-xs font-bold text-rose-800 transition-all hover:bg-rose-100/80 dark:border-rose-500/35 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-950/70"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{t.actions.sendToPolice}</span>
            <span className="rounded-full border border-rose-300/80 bg-white/80 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-rose-700 dark:border-rose-500/35 dark:bg-rose-900/50 dark:text-rose-200">
              {t.actions.conceptBadge}
            </span>
          </button>
        </div>

        {pdfError && (
          <p
            role="alert"
            className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200"
          >
            {pdfError}
          </p>
        )}

        {showPoliceConcept && (
          <div className="mt-3 rounded-2xl border border-slate-200/90 bg-slate-50/80 px-4 py-3 text-xs leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
            <p className="font-bold text-slate-900 dark:text-white">{t.actions.amanTitle}</p>
            {/* Official Aman channels, verified on aman.adpolice.gov.ae and adpolice.gov.ae */}
            <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
              <div className="flex items-baseline gap-2">
                <dt className="text-slate-500 dark:text-slate-400">{t.actions.amanPhoneLabel}</dt>
                <dd dir="ltr" className="font-mono font-semibold">
                  <a className="underline-offset-2 hover:underline" href="tel:8002626">
                    800 2626
                  </a>
                </dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="text-slate-500 dark:text-slate-400">{t.actions.amanSmsLabel}</dt>
                <dd dir="ltr" className="font-mono font-semibold">
                  2828
                </dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="text-slate-500 dark:text-slate-400">{t.actions.amanEmailLabel}</dt>
                <dd dir="ltr" className="font-mono font-semibold">
                  <a className="underline-offset-2 hover:underline" href="mailto:aman@adpolice.gov.ae">
                    aman@adpolice.gov.ae
                  </a>
                </dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="text-slate-500 dark:text-slate-400">{t.actions.amanWebLabel}</dt>
                <dd dir="ltr" className="font-mono font-semibold">
                  <a
                    className="underline-offset-2 hover:underline"
                    href="https://aman.adpolice.gov.ae"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    aman.adpolice.gov.ae
                  </a>
                </dd>
              </div>
            </dl>
            <p className="mt-2.5 flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {t.actions.policeConceptNotice} {t.actions.amanNote}
              </span>
            </p>
          </div>
        )}
      </section>

      {/* Progressive Disclosure: Deep Digital Investigator Technical Details */}
      {showDetails && (
        <div className="space-y-5">
          {/* Detected Findings & Red Flags */}
          <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#0e161e]">
            <div className="mb-3 flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-emerald-700 dark:text-emerald-400" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {t.redFlagsTitle}
              </h3>
            </div>

            {result.redFlags.length === 0 ? (
              <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 px-4 py-3 text-xs text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-950/35 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{t.noRedFlagsText}</span>
              </div>
            ) : (
              <ul className="space-y-2">
                {result.redFlags.map((flag, idx) => (
                  <li
                    key={`${flag.code}-${idx}`}
                    className="flex items-start gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/75 px-3.5 py-2.5 dark:border-slate-800/80 dark:bg-slate-900/45"
                  >
                    {flag.severity === 'critical' || flag.severity === 'high' ? (
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    ) : flag.severity === 'medium' ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${SEVERITY_BADGE[flag.severity]}`}
                        >
                          {t.severity[flag.severity]}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                          {locale === 'ar' ? flag.titleAr : flag.titleEn}
                        </span>
                      </div>
                      <p className="mt-0.5 break-words text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        {locale === 'ar' ? flag.detailAr : flag.detailEn}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <GroundingSources
              sources={result.aiAnalysis.groundingSources}
              groundingUsed={result.aiAnalysis.groundingUsed}
            />
          </section>

          {/* Mode-Specific Insights (Job Authenticity % or Map Place/Review Verification) */}
          <ModeInsightsCard
            jobAnalysis={result.aiAnalysis.jobAnalysis}
            mapAnalysis={result.aiAnalysis.mapAnalysis}
          />

          {/* Technical Security Forensics Cards Grid */}
          <TechnicalChecksGrid
            checks={result.technicalChecks}
            promptInjection={result.promptInjection}
          />

          {/* Expandable Raw Technical Metadata JSON */}
          <RawMetadataViewer result={result} />
        </div>
      )}
    </div>
  );
}
