import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Shield } from 'lucide-react';
import { useLocale } from '../i18n/LocaleContext';

export function ScanProgress() {
  const { t } = useLocale();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStep((prev) => (prev < t.progressSteps.length - 1 ? prev + 1 : prev));
    }, 1500);
    return () => window.clearInterval(timer);
  }, [t.progressSteps.length]);

  return (
    <div className="mx-auto mt-8 w-full max-w-2xl rounded-3xl border border-emerald-500/25 bg-white/95 p-6 shadow-xl shadow-emerald-900/5 dark:border-emerald-500/20 dark:bg-[#0e161e]/95">
      <div className="mb-5 flex items-center gap-3">
        <div className="animate-scan-pulse flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t.progressTitle}
          </h3>
          <p className="font-mono text-xs text-emerald-700 dark:text-emerald-400">
            Playwright Headless Shell • TLS • RDAP • Gemini 3.5 Flash-Lite
          </p>
        </div>
      </div>

      <ol className="space-y-3">
        {t.progressSteps.map((label, idx) => {
          const isDone = idx < activeStep;
          const isCurrent = idx === activeStep;
          return (
            <li
              key={label}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all ${
                isCurrent
                  ? 'bg-emerald-50/90 font-semibold text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                  : isDone
                    ? 'text-slate-600 dark:text-slate-300'
                    : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : isCurrent ? (
                <Loader2 className="h-4.5 w-4.5 shrink-0 animate-spin text-emerald-600 dark:text-emerald-400" />
              ) : (
                <span className="h-4 w-4 shrink-0 rounded-full border border-slate-300 dark:border-slate-700" />
              )}
              <span>{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
