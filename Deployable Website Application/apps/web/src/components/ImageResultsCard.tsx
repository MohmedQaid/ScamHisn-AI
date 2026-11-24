import { useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  Info,
  Maximize2,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  X,
} from 'lucide-react';
import type { ImageAuthenticityStatus, ImageScanResponse } from '@scamhisn/shared';
import { useLocale } from '../i18n/LocaleContext';
import { VerdictBand } from './VerdictBand';
import { SectionHeading } from './ScribbleUnderline';
import { EvidenceList } from './EvidenceList';
import { RawMetadataViewer } from './RawMetadataViewer';

interface ImageResultsCardProps {
  result: ImageScanResponse;
  previewDataUrl: string;
  fileName: string;
  onDeepScanUrl: (url: string) => void;
}

const AUTH_CHIP: Record<ImageAuthenticityStatus, { chip: string; icon: string }> = {
  genuine: { chip: 'bg-brand-tint', icon: 'text-brand' },
  suspicious: { chip: 'bg-warn-tint', icon: 'text-warn' },
  forged_or_scam: { chip: 'bg-danger-tint', icon: 'text-danger' },
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
  const authStyle = AUTH_CHIP[result.authenticityStatus];

  const evidenceItems = result.findings.map((flag, idx) => ({
    key: `${flag.titleEn}-${idx}`,
    Icon:
      flag.severity === 'critical' || flag.severity === 'high'
        ? ShieldAlert
        : flag.severity === 'medium'
          ? AlertTriangle
          : Info,
    severity: flag.severity,
    title: locale === 'ar' ? flag.titleAr : flag.titleEn,
    detail: locale === 'ar' ? flag.detailAr : flag.detailEn,
  }));

  return (
    <div className="mt-8 w-full sm:mt-10">
      <VerdictBand
        verdict={result.verdict}
        score={result.scamScore}
        label={verdictMeta.label}
        sentence={summaryText}
        scoreLabel={t.scamLikelihoodLabel}
      />

      {/* Authenticity, impersonated entity, and the screenshot itself */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col items-start gap-2.5">
          <p
            className={`flex w-fit max-w-full items-start gap-2.5 rounded-ctl px-4 py-3 text-sm font-semibold leading-snug text-ink sm:text-[15px] ${authStyle.chip}`}
          >
            <AuthIcon className={`mt-px h-5 w-5 shrink-0 ${authStyle.icon}`} strokeWidth={1.75} aria-hidden="true" />
            <span className="min-w-0">
              {t.imageMode.authenticityLabel}: {t.imageMode.authenticity[result.authenticityStatus]}
            </span>
          </p>

          {result.impersonatedEntity && (
            <p className="flex w-fit max-w-full items-start gap-2.5 rounded-ctl bg-danger-tint px-4 py-3 text-sm font-semibold leading-snug text-ink sm:text-[15px]">
              <ShieldAlert className="mt-px h-5 w-5 shrink-0 text-danger" strokeWidth={1.75} aria-hidden="true" />
              <span className="min-w-0 break-words">
                {t.labels.impersonatedBrand}: {result.impersonatedEntity}
              </span>
            </p>
          )}

          <p className="text-xs text-muted">
            {result.cached && (
              <>
                {t.imageMode.cachedTag}
                <span aria-hidden="true"> · </span>
              </>
            )}
            <span dir="ltr" className="font-mono">
              {(result.durationMs / 1000).toFixed(1)}s
            </span>
          </p>
        </div>

        {/* Uploaded screenshot thumbnail: opens the full preview */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          title={t.imageMode.previewLabel}
          className="box group flex w-full shrink-0 cursor-pointer flex-col items-center overflow-hidden p-2 transition-colors hover:border-brand sm:w-44"
        >
          <img
            src={previewDataUrl}
            alt={fileName}
            className="max-h-40 w-auto max-w-full rounded-[14px] object-contain sm:max-h-28"
          />
          <span className="mt-1.5 inline-flex w-full items-center justify-center gap-1 truncate text-xs font-bold text-muted group-hover:text-brand">
            <Maximize2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="truncate">{t.imageMode.previewLabel}</span>
          </span>
        </button>
      </div>

      {/* Visual prompt-injection alert */}
      {result.visualPromptInjectionDetected && (
        <div role="alert" className="mt-6 flex items-start gap-3.5 rounded-box bg-danger-tint p-5 sm:p-6">
          <ShieldAlert className="mt-0.5 h-7 w-7 shrink-0 text-danger" strokeWidth={1.6} aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-lg font-extrabold text-ink">{t.imageMode.visualInjectionAlert}</p>
            <p className="mt-1 break-words text-sm leading-relaxed text-ink/85">{t.promptInjectionSubtitle}</p>
          </div>
        </div>
      )}

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

      {/* Action: the official police channel */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setShowPoliceConcept((prev) => !prev)}
          aria-expanded={showPoliceConcept}
          className="btn btn-outline h-14 px-6 text-base sm:min-w-[20rem]"
        >
          <ShieldCheck className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          <span>{t.actions.sendToPolice}</span>
        </button>
      </div>

      {showPoliceConcept && (
        <div className="box mt-4 flex items-start gap-2.5 px-5 py-4 text-sm leading-relaxed text-ink sm:px-6 sm:py-5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted" strokeWidth={1.75} aria-hidden="true" />
          <p className="min-w-0 break-words">
            <strong className="font-extrabold">{t.actions.amanTitle}</strong>
            <br />
            <span dir="ltr" className="font-mono">
              800 2626 · SMS 2828 · aman@adpolice.gov.ae
            </span>
            <br />
            <span className="text-muted">{t.actions.amanNote}</span>
          </p>
        </div>
      )}

      {/* Technical details: quiet disclosure */}
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
          {/* Authenticity & Visual Forgery Analysis */}
          <section>
            <h3 className="mb-2 text-base font-extrabold text-ink">{t.imageMode.authenticityAnalysisTitle}</h3>
            <p className="break-words text-sm leading-relaxed text-ink/85 sm:text-[15px]">{authenticityNotes}</p>
          </section>

          {/* Extracted URLs (with 1-Click Deep-Scan) */}
          {result.extractedUrls.length > 0 && (
            <section>
              <h3 className="mb-3 text-base font-extrabold text-ink">{t.imageMode.extractedUrlsTitle}</h3>
              <ul className="space-y-2.5">
                {result.extractedUrls.map((spottedUrl) => (
                  <li
                    key={spottedUrl}
                    className="box flex flex-col gap-2 py-2 pe-2 ps-4 sm:flex-row sm:items-center sm:justify-between sm:ps-5"
                  >
                    <span dir="ltr" className="min-w-0 break-all py-1.5 text-start font-mono text-sm text-ink">
                      {spottedUrl}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeepScanUrl(normalizeExtractedUrl(spottedUrl))}
                      className="btn btn-primary btn-sm shrink-0"
                    >
                      <ScanSearch className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                      <span>{t.imageMode.deepScanBtn}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Phone numbers */}
          {result.extractedPhones.length > 0 && (
            <section>
              <h3 className="mb-2 text-base font-extrabold text-ink">{t.imageMode.extractedPhonesTitle}</h3>
              <ul className="flex flex-wrap gap-x-6 gap-y-1.5">
                {result.extractedPhones.map((phone) => (
                  <li key={phone} dir="ltr" className="font-mono text-sm font-semibold text-ink">
                    {phone}
                  </li>
                ))}
              </ul>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="box relative max-h-[90vh] max-w-3xl overflow-hidden p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-3 px-2">
              <span dir="ltr" className="truncate font-mono text-xs text-muted">
                {fileName}
              </span>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-brand-tint"
                aria-label="Close"
              >
                <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <img
              src={previewDataUrl}
              alt={fileName}
              className="max-h-[78vh] w-auto max-w-full rounded-[14px] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
