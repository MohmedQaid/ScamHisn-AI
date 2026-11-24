import { useState, type ComponentType } from 'react';
import {
  AlertTriangle,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  Fish,
  GitFork,
  Globe,
  Info,
  KeyRound,
  Link2,
  Loader2,
  Lock,
  MapPin,
  ScanSearch,
  Server,
  ShieldCheck,
  Syringe,
  Unplug,
  UserRoundX,
} from 'lucide-react';
import type { BilingualFlag, ScanResponse } from '@scamhisn/shared';
import { useLocale } from '../i18n/LocaleContext';
import { downloadForensicReportPdf } from '../api/client';
import { VerdictBand } from './VerdictBand';
import { SectionHeading } from './ScribbleUnderline';
import { EvidenceList } from './EvidenceList';
import { PromptInjectionBanner } from './PromptInjectionBanner';
import { ModeInsightsCard } from './ModeInsightsCard';
import { TechnicalChecksGrid } from './TechnicalChecksGrid';
import { GroundingSources } from './GroundingSources';
import { RawMetadataViewer } from './RawMetadataViewer';

interface ResultsDashboardProps {
  result: ScanResponse;
}

const CATEGORY_ICON: Record<
  BilingualFlag['category'],
  ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  ssl: Lock,
  domain: Globe,
  redirect: GitFork,
  headers: Server,
  credential_harvesting: KeyRound,
  impersonation: UserRoundX,
  prompt_injection: Syringe,
  phishing_kit: Fish,
  job_scam: Briefcase,
  map_scam: MapPin,
  ai_forensics: ScanSearch,
  network: Unplug,
};

export function ResultsDashboard({ result }: ResultsDashboardProps) {
  const { locale, t } = useLocale();
  const [showDetails, setShowDetails] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [showPoliceConcept, setShowPoliceConcept] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

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
        ? // "safe" without AI only happens for an official domain on our verified list
          result.verdict === 'safe'
          ? t.coverage.officialNoAi
          : t.coverage.rulesOnly
        : coverageLevel === 'partial'
          ? pageLoaded
            ? t.coverage.partialBackup
            : t.coverage.partialPageNotLoaded
          : t.coverage.full;
  const isFullCoverage = coverageLevel === 'full';

  // A clean technical result without AI is "incomplete", never a confident verdict
  // The server already downgrades such results to "caution". When it still says "safe" without AI,
  // that is its official-domain rule (adpolice.gov.ae, tamm.abudhabi, u.ae ...): trust it.
  const isIncompleteCheck =
    (coverageLevel === 'rules_only' || coverageLevel === 'address_only') &&
    result.scamScore <= 19 &&
    result.verdict !== 'safe';
  const verdictLabel = isIncompleteCheck ? t.coverage.incompleteLabel : verdictMeta.label;

  // When the AI did not answer and the rules found real risk, lead with the verdict text;
  // otherwise show the summary (which now says plainly when AI was unavailable).
  const aiUnavailable = result.aiAnalysis.status === 'unavailable';
  const displayHeadlineText =
    aiUnavailable &&
    coverageLevel !== 'address_only' &&
    (result.scamScore >= 45 || result.verdict === 'safe')
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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(result.finalUrl);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1800);
    } catch {
      // Clipboard needs permission in some browsers: the link stays selectable as text
    }
  };

  const evidenceItems = result.redFlags.map((flag, idx) => ({
    key: `${flag.code}-${idx}`,
    Icon: CATEGORY_ICON[flag.category] ?? Info,
    severity: flag.severity,
    title: locale === 'ar' ? flag.titleAr : flag.titleEn,
    detail: locale === 'ar' ? flag.detailAr : flag.detailEn,
  }));

  return (
    <div className="mt-8 w-full sm:mt-10">
      <VerdictBand
        verdict={result.verdict}
        score={result.scamScore}
        label={verdictLabel}
        sentence={displayHeadlineText}
        scoreLabel={t.scamLikelihoodLabel}
        incomplete={isIncompleteCheck}
      />

      {/* Coverage: say plainly how much of the analysis ran */}
      <p
        className={`mt-4 flex w-fit max-w-full items-start gap-2.5 rounded-ctl px-4 py-3 text-start text-sm font-semibold leading-snug text-ink sm:text-[15px] ${
          isFullCoverage ? 'bg-brand-tint' : 'bg-warn-tint'
        }`}
      >
        {isFullCoverage ? (
          <CheckCircle2
            className="mt-px h-5 w-5 shrink-0 text-brand"
            fill="currentColor"
            stroke="var(--color-brand-tint)"
            aria-hidden="true"
          />
        ) : (
          <AlertTriangle className="mt-px h-5 w-5 shrink-0 text-warn" strokeWidth={1.75} aria-hidden="true" />
        )}
        <span className="min-w-0">
          {coverageText}
          {/* Name the models when a self-hosted model judged (alone or with Gemini's research) */}
          {(result.coverage?.aiProvider === 'hybrid' || result.coverage?.aiProvider === 'local') &&
            result.coverage.aiModel && (
              <span dir="ltr" className="ms-1.5 inline-block font-mono text-xs font-medium text-muted">
                {result.coverage.aiModel}
              </span>
            )}
        </span>
      </p>

      {/* Critical smoking-gun and prompt-injection alerts: always shown, never behind the disclosure */}
      <div className="mt-6 empty:hidden">
        <PromptInjectionBanner
          promptInjection={result.promptInjection}
          aiDetectedPromptInjection={result.aiAnalysis.aiDetectedPromptInjection}
          aiEvidence={result.aiAnalysis.promptInjectionEvidence}
          smokingGuns={result.smokingGunsTriggered}
        />
      </div>

      {/* Evidence */}
      <section className="mt-8 border-t border-hairline pt-8">
        <SectionHeading>{t.evidence.title}</SectionHeading>
        <div className="mt-4">
          {evidenceItems.length === 0 ? (
            <p className="flex items-start gap-2.5 text-base text-ink">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" strokeWidth={1.75} aria-hidden="true" />
              <span>{t.noRedFlagsText}</span>
            </p>
          ) : (
            <EvidenceList items={evidenceItems} />
          )}
        </div>
      </section>

      {/* Checked link: plain text, never a clickable link */}
      <section className="mt-8">
        <SectionHeading>{t.checkedLink.title}</SectionHeading>
        <div className="box mt-4 flex items-center gap-3 py-2 pe-2 ps-4 sm:ps-5">
          <Link2 className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.75} aria-hidden="true" />
          <p dir="ltr" className="min-w-0 flex-1 break-all py-1.5 text-left font-mono text-sm text-ink sm:text-[15px] rtl:text-right">
            {result.finalUrl}
          </p>
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label={t.checkedLink.copy}
            title={linkCopied ? t.checkedLink.copied : t.checkedLink.copy}
            className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-[10px] px-2.5 text-sm font-bold text-muted transition-colors hover:bg-brand-tint hover:text-brand"
          >
            {linkCopied ? (
              <Check className="h-[18px] w-[18px] text-brand" aria-hidden="true" />
            ) : (
              <Copy className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
            )}
            <span className="max-sm:sr-only" aria-live="polite">
              {linkCopied ? t.checkedLink.copied : t.checkedLink.copy}
            </span>
          </button>
        </div>
      </section>

      {/* Actions: evidence report (PDF) and the official police channel */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleGeneratePdf}
          disabled={isGeneratingPdf}
          className="btn btn-primary h-14 px-6 text-base sm:flex-1"
        >
          {isGeneratingPdf ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              <span>{t.actions.generatingReport}</span>
            </>
          ) : (
            <>
              <Download className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
              <span>{t.actions.downloadReport}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowPoliceConcept((prev) => !prev)}
          aria-expanded={showPoliceConcept}
          className="btn btn-outline h-14 px-6 text-base sm:flex-1"
        >
          <ShieldCheck className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          <span>{t.actions.sendToPolice}</span>
        </button>
      </div>

      {pdfError && (
        <p role="alert" className="mt-3 rounded-ctl bg-danger-tint px-4 py-3 text-sm font-semibold text-ink">
          {pdfError}
        </p>
      )}

      {showPoliceConcept && (
        <div className="box mt-4 px-5 py-4 text-sm leading-relaxed text-ink sm:px-6 sm:py-5">
          <p className="text-base font-extrabold">{t.actions.amanTitle}</p>
          {/* Official Aman channels, verified on aman.adpolice.gov.ae and adpolice.gov.ae */}
          <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
            <div className="flex items-baseline gap-2">
              <dt className="text-muted">{t.actions.amanPhoneLabel}</dt>
              <dd dir="ltr" className="font-mono font-semibold">
                <a className="underline-offset-4 hover:underline" href="tel:8002626">
                  800 2626
                </a>
              </dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className="text-muted">{t.actions.amanSmsLabel}</dt>
              <dd dir="ltr" className="font-mono font-semibold">
                2828
              </dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className="text-muted">{t.actions.amanEmailLabel}</dt>
              <dd dir="ltr" className="font-mono font-semibold">
                <a className="underline-offset-4 hover:underline" href="mailto:aman@adpolice.gov.ae">
                  aman@adpolice.gov.ae
                </a>
              </dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className="text-muted">{t.actions.amanWebLabel}</dt>
              <dd dir="ltr" className="font-mono font-semibold">
                <a
                  className="underline-offset-4 hover:underline"
                  href="https://aman.adpolice.gov.ae"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  aman.adpolice.gov.ae
                </a>
              </dd>
            </div>
          </dl>
          <p className="mt-3 flex items-start gap-2 text-muted">
            <Info className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>
              {t.actions.policeConceptNotice} {t.actions.amanNote}
            </span>
          </p>
        </div>
      )}

      {/* Technical details: quiet disclosure for the full forensic sections */}
      <div className="mt-8 border-t border-hairline pt-5">
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          aria-expanded={showDetails}
          className="inline-flex cursor-pointer items-center gap-1.5 py-1 text-sm font-bold text-muted transition-colors hover:text-ink sm:text-[15px]"
        >
          <span>{showDetails ? t.actions.hideDetails : t.actions.showDetails}</span>
          <ChevronDown
            className={`h-[18px] w-[18px] transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`}
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </button>
      </div>

      {showDetails && (
        <div className="mt-5 space-y-8">
          <p className="text-sm text-muted">
            {t.modes[result.mode].label}
            <span aria-hidden="true"> · </span>
            <span dir="ltr" className="font-mono text-xs">
              {(result.durationMs / 1000).toFixed(1)}s
            </span>
          </p>

          <GroundingSources
            sources={result.aiAnalysis.groundingSources}
            groundingUsed={result.aiAnalysis.groundingUsed}
          />

          {/* Mode-Specific Insights (Job Authenticity % or Map Place/Review Verification) */}
          <ModeInsightsCard
            jobAnalysis={result.aiAnalysis.jobAnalysis}
            mapAnalysis={result.aiAnalysis.mapAnalysis}
          />

          {/* Technical Security Forensics Cards Grid */}
          <TechnicalChecksGrid checks={result.technicalChecks} promptInjection={result.promptInjection} />

          {/* Expandable Raw Technical Metadata JSON */}
          <RawMetadataViewer result={result} />
        </div>
      )}
    </div>
  );
}
