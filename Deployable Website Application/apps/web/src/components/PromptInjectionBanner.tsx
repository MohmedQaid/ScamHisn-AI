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
    <div className="space-y-3">
      {hasInjection && (
        <div
          role="alert"
          className="rounded-3xl border-2 border-rose-500/80 bg-gradient-to-br from-rose-50 via-red-50 to-rose-100/80 p-5 shadow-lg shadow-rose-900/10 dark:border-rose-500/60 dark:from-rose-950/80 dark:via-[#200a12] dark:to-rose-950/60"
        >
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-md shadow-rose-900/30">
              <AlertOctagon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-extrabold text-rose-900 dark:text-rose-100">
                {t.promptInjectionTitle}
              </h3>
              <p className="mt-1 text-sm text-rose-800/90 dark:text-rose-200/90">
                {t.promptInjectionSubtitle}
              </p>

              {aiEvidence && (
                <p className="mt-2.5 rounded-xl bg-white/80 px-3 py-2 font-mono text-xs text-rose-900 dark:bg-black/35 dark:text-rose-200">
                  {aiEvidence}
                </p>
              )}

              {promptInjection.findings.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {promptInjection.findings.slice(0, 5).map((finding, idx) => (
                    <li
                      key={`${finding.patternName}-${idx}`}
                      className="rounded-xl border border-rose-200/90 bg-white/85 px-3 py-2 text-xs dark:border-rose-500/25 dark:bg-black/35"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-rose-600 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
                          {finding.channel}
                        </span>
                        <span className="font-mono font-semibold text-rose-900 dark:text-rose-200">
                          {finding.patternName}
                        </span>
                      </div>
                      <p dir="ltr" className="mt-1 break-all font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {finding.matchedExcerpt}
                      </p>
                      {finding.decodedPayload && (
                        <p dir="ltr" className="mt-1 break-all font-mono text-[11px] font-semibold text-rose-700 dark:text-rose-300">
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
        <div className="rounded-3xl border border-rose-300/90 bg-rose-50/85 p-5 dark:border-rose-500/40 dark:bg-rose-950/35">
          <div className="mb-3 flex items-center gap-2 text-rose-800 dark:text-rose-300">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <h3 className="text-sm font-extrabold">{t.smokingGunTitle}</h3>
          </div>
          <ul className="space-y-2.5">
            {smokingGuns.map((sg) => (
              <li
                key={sg.code}
                className="rounded-2xl border border-rose-200/80 bg-white/90 px-4 py-3 dark:border-rose-500/25 dark:bg-[#130c10]/85"
              >
                <p className="text-sm font-bold text-rose-900 dark:text-rose-200">
                  {locale === 'ar' ? sg.titleAr : sg.titleEn}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
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
