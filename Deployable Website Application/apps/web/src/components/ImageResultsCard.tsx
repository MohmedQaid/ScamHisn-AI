import { useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Image as ImageIcon,
  Info,
  Link2,
  Maximize2,
  Phone,
  Send,
  ShieldAlert,
  ShieldX,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import type {
  ImageAuthenticityStatus,
  ImageScanResponse,
  Severity,
  VerdictLevel,
} from '@scamhisn/shared';
import { useLocale } from '../i18n/LocaleContext';
import { RiskGauge } from './RiskGauge';
import { RawMetadataViewer } from './RawMetadataViewer';

interface ImageResultsCardProps {
  result: ImageScanResponse;
  previewDataUrl: string;
  fileName: string;
  onDeepScanUrl: (url: string) => void;
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

const AUTH_BADGE: Record<ImageAuthenticityStatus, string> = {
  genuine:
    'border-emerald-300/80 bg-emerald-50/90 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/70 dark:text-emerald-300',
  suspicious:
    'border-amber-300/80 bg-amber-50/90 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/60 dark:text-amber-200',
  forged_or_scam:
    'border-rose-400/80 bg-rose-50/95 text-rose-800 dark:border-rose-500/45 dark:bg-rose-950/70 dark:text-rose-200',
};

const SEVERITY_BADGE: Record<Severity, string> = {
  critical: 'bg-rose-600 text-white',
  high: 'bg-orange-600 text-white',
  medium: 'bg-amber-500/20 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  low: 'bg-sky-500/15 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300',
  info: 'bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

function normalizeExtractedUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function ImageResultsCard({
  result,
  previewDataUrl,
  fileName,
  onDeepScanUrl,
}: ImageResultsCardProps) {
  const { locale, t } = useLocale();
  const [showDetails, setShowDetails] = useState(false);
  const [showPoliceConcept, setShowPoliceConcept] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const verdictMeta = t.verdicts[result.verdict];
  const summaryText = locale === 'ar' ? result.summaryAr : result.summaryEn;
  const authenticityNotes =
    locale === 'ar' ? result.authenticityNotesAr : result.authenticityNotesEn;

  const AuthIcon =
    result.authenticityStatus === 'genuine'
      ? BadgeCheck
      : result.authenticityStatus === 'suspicious'
        ? AlertTriangle
        : ShieldX;

  return (
    <div className="mx-auto mt-6 w-full max-w-4xl space-y-4">
      {/* Visual Prompt-Injection Alert Banner */}
      {result.visualPromptInjectionDetected && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-3xl border border-rose-400/70 bg-rose-50/95 px-5 py-4 text-rose-900 shadow-sm dark:border-rose-500/50 dark:bg-rose-950/75 dark:text-rose-100"
        >
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <div className="min-w-0">
            <p className="text-sm font-extrabold">{t.imageMode.visualInjectionAlert}</p>
            <p className="mt-0.5 break-words text-xs leading-relaxed opacity-90">
              {t.promptInjectionSubtitle}
            </p>
          </div>
        </div>
      )}

      {/* Minimal End-User Image Verdict Card */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-5 shadow-lg shadow-slate-900/[0.04] backdrop-blur-md dark:border-slate-800 dark:bg-[#0e161e]/95 dark:shadow-black/40">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5">
          {/* Compact Percentage Ring */}
          <RiskGauge score={result.scamScore} verdict={result.verdict} />

          {/* Verdict, Authenticity Pill & Concise Summary */}
          <div className="w-full min-w-0 flex-1 text-center sm:text-start">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-extrabold ${VERDICT_BADGE[result.verdict]}`}
              >
                {verdictMeta.label}
              </span>

              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-extrabold ${AUTH_BADGE[result.authenticityStatus]}`}
              >
                <AuthIcon className="h-3.5 w-3.5" />
                <span>
                  {t.imageMode.authenticityLabel}:{' '}
                  {t.imageMode.authenticity[result.authenticityStatus]}
                </span>
              </span>

              {result.cached && (
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-300/70 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-800 dark:border-sky-500/35 dark:bg-sky-950/60 dark:text-sky-300">
                  <Sparkles className="h-3 w-3" />
                  <span>{t.imageMode.cachedTag}</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                <Clock className="h-3 w-3" />
                {(result.durationMs / 1000).toFixed(1)}s
              </span>
            </div>

            {result.impersonatedEntity && (
              <p className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/75 px-2.5 py-1 text-xs font-bold text-rose-800 dark:border-rose-500/35 dark:bg-rose-950/45 dark:text-rose-200">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {t.labels.impersonatedBrand}: {result.impersonatedEntity}
                </span>
              </p>
            )}

            <p className="mt-2 break-words text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              {summaryText}
            </p>
          </div>

          {/* Visible Uploaded Image Preview Thumbnail */}
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            title={t.imageMode.previewLabel}
            className="group relative flex w-full shrink-0 cursor-pointer flex-col items-center overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50/90 p-2 transition-all hover:border-emerald-500/60 dark:border-slate-700/80 dark:bg-slate-950/75 sm:w-36"
          >
            <img
              src={previewDataUrl}
              alt={fileName}
              className="max-h-40 w-auto max-w-full rounded-xl object-contain sm:h-24"
            />
            <span className="mt-1.5 inline-flex w-full items-center justify-center gap-1 truncate text-[10.5px] font-semibold text-slate-500 group-hover:text-emerald-700 dark:text-slate-400 dark:group-hover:text-emerald-300">
              <Maximize2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{t.imageMode.previewLabel}</span>
            </span>
          </button>
        </div>

        {/* Action Strip */}
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

        {showPoliceConcept && (
          <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-amber-200/90 bg-amber-50/80 px-4 py-3 text-xs leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/35 dark:text-amber-200">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="min-w-0 break-words">{t.actions.policeConceptNotice}</p>
          </div>
        )}
      </section>

      {/* Progressive Disclosure: Image Authenticity & Extracted Indicators */}
      {showDetails && (
        <div className="space-y-4">
          {/* Authenticity & Visual Forgery Analysis */}
          <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#0e161e]">
            <div className="mb-2.5 flex items-center gap-2">
              <ImageIcon className="h-4.5 w-4.5 text-emerald-700 dark:text-emerald-400" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {t.imageMode.authenticityAnalysisTitle}
              </h3>
            </div>
            <p className="break-words text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
              {authenticityNotes}
            </p>
          </section>

          {/* Detected Findings */}
          <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#0e161e]">
            <div className="mb-3 flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-emerald-700 dark:text-emerald-400" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {t.redFlagsTitle}
              </h3>
            </div>

            {result.findings.length === 0 ? (
              <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 px-4 py-3 text-xs text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-950/35 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{t.noRedFlagsText}</span>
              </div>
            ) : (
              <ul className="space-y-2">
                {result.findings.map((flag, idx) => (
                  <li
                    key={`${flag.titleEn}-${idx}`}
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
                        <span className="break-words text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
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
          </section>

          {/* Extracted URLs (with 1-Click Deep-Scan) & Phone Numbers */}
          {(result.extractedUrls.length > 0 || result.extractedPhones.length > 0) && (
            <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#0e161e]">
              <div className="space-y-4">
                {result.extractedUrls.length > 0 && (
                  <div>
                    <div className="mb-2.5 flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {t.imageMode.extractedUrlsTitle}
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {result.extractedUrls.map((spottedUrl) => (
                        <li
                          key={spottedUrl}
                          className="flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/75 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900/50"
                        >
                          <span
                            dir="ltr"
                            className="min-w-0 break-all font-mono text-xs text-slate-700 dark:text-slate-200"
                          >
                            {spottedUrl}
                          </span>
                          <button
                            type="button"
                            onClick={() => onDeepScanUrl(normalizeExtractedUrl(spottedUrl))}
                            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-400/35 dark:bg-emerald-950/60 dark:text-emerald-300"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>{t.imageMode.deepScanBtn}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.extractedPhones.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {t.imageMode.extractedPhonesTitle}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.extractedPhones.map((phone) => (
                        <span
                          key={phone}
                          dir="ltr"
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                          {phone}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Raw JSON Viewer */}
          <RawMetadataViewer result={result} />
        </div>
      )}

      {/* Fullscreen Preview Lightbox Modal */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 p-3 shadow-2xl"
          >
            <div className="mb-2 flex items-center justify-between gap-3 px-2">
              <span dir="ltr" className="truncate font-mono text-xs text-slate-300">
                {fileName}
              </span>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <img
              src={previewDataUrl}
              alt={fileName}
              className="max-h-[78vh] w-auto max-w-full rounded-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
