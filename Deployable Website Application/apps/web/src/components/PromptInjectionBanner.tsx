import { AlertOctagon, ShieldAlert } from 'lucide-react';
import type { BilingualFlag, PromptInjectionReport } from '@scamhisn/shared';
import { useLocale } from '../i18n/LocaleContext';

interface PromptInjectionBannerProps {
  promptInjection: PromptInjectionReport;
  aiDetectedPromptInjection: boolean;
  aiEvidence: string | null;
  smokingGuns: BilingualFlag[];
}

export function PromptInjectionBanner({
  promptInjection,
  aiDetectedPromptInjection,
  aiEvidence,
  smokingGuns,
}: PromptInjectionBannerProps) {
  const { locale, t } = useLocale();
  const hasInjection = promptInjection.detected || aiDetectedPromptInjection;

  if (!hasInjection && smokingGuns.length === 0) return null;

  return (
    <div className="space-y-4">
      {hasInjection && (
        <div role="alert" className="rounded-box bg-danger-tint p-5 sm:p-6">
          <div className="flex items-start gap-3.5">
            <AlertOctagon className="mt-0.5 h-7 w-7 shrink-0 text-danger" strokeWidth={1.6} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-extrabold text-ink">{t.promptInjectionTitle}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink/85">{t.promptInjectionSubtitle}</p>

              {aiEvidence && (
                <p className="mt-3 break-words rounded-ctl bg-surface px-3.5 py-2.5 font-mono text-xs text-ink">
                  {aiEvidence}
                </p>
              )}

              {promptInjection.findings.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {promptInjection.findings.slice(0, 5).map((finding, idx) => (
                    <li
                      key={`${finding.patternName}-${idx}`}
                      className="rounded-ctl bg-surface px-3.5 py-2.5 text-xs"
                    >
                      <p className="font-mono font-semibold text-ink">
                        <span className="font-bold uppercase text-danger">{finding.channel}</span>
                        <span aria-hidden="true"> · </span>
                        {finding.patternName}
                      </p>
                      <p dir="ltr" className="mt-1 break-all font-mono text-[11px] text-muted">
                        {finding.matchedExcerpt}
                      </p>
                      {finding.decodedPayload && (
                        <p dir="ltr" className="mt-1 break-all font-mono text-[11px] font-semibold text-danger">
                          Decoded: {finding.decodedPayload}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {smokingGuns.length > 0 && (
        <div className="rounded-box bg-danger-tint p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2.5">
            <ShieldAlert className="h-6 w-6 shrink-0 text-danger" strokeWidth={1.6} aria-hidden="true" />
            <h3 className="text-base font-extrabold text-ink">{t.smokingGunTitle}</h3>
          </div>
          <ul className="divide-y divide-danger/20">
            {smokingGuns.map((sg) => (
              <li key={sg.code} className="py-2.5 first:pt-0 last:pb-0">
                <p className="text-sm font-bold text-ink sm:text-[15px]">
                  {locale === 'ar' ? sg.titleAr : sg.titleEn}
                </p>
                <p className="mt-0.5 break-words text-sm leading-relaxed text-ink/80">
                  {locale === 'ar' ? sg.detailAr : sg.detailEn}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
