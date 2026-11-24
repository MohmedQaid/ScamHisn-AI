import { useEffect, useState } from 'react';
import { CheckCircle2, Image as ImageIcon, Loader2, Shield } from 'lucide-react';
import { useLocale } from '../i18n/LocaleContext';

interface ScanProgressProps {
  variant?: 'url' | 'image';
}

const IMAGE_STEPS = {
  en: [
    'Compressing image to low-token single-tile format',
    'Checking visual genuineness, tampering & brand impersonation',
    'Extracting visible links & computing authenticity verdict',
  ],
  ar: [
    'ضغط الصورة لتوفير رصيد الفحص وسرعة الرفع',
    'فحص الأصالة البصرية والتلاعب وانتحال الجهات الرسمية',
    'استخراج الروابط المرصودة وحساب النتيجة النهائية',
  ],
} as const;

export function ScanProgress({ variant = 'url' }: ScanProgressProps) {
  const { locale, t } = useLocale();
  const steps = variant === 'image' ? IMAGE_STEPS[locale] : t.progressSteps;
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    setActiveStep(0);
    const intervalMs = variant === 'image' ? 900 : 1500;
    const timer = window.setInterval(() => {
      setActiveStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [steps.length, variant]);

  return (
    <div className="box mx-auto mt-8 w-full max-w-2xl px-5 py-5 sm:px-7 sm:py-6">
      <div className="mb-3 flex items-center gap-3">
        <span className="animate-scan-pulse shrink-0 text-brand">
          {variant === 'image' ? (
            <ImageIcon className="h-7 w-7" strokeWidth={1.6} aria-hidden="true" />
          ) : (
            <Shield className="h-7 w-7" strokeWidth={1.6} aria-hidden="true" />
          )}
        </span>
        <h3 className="min-w-0 text-lg font-extrabold text-ink">
          {variant === 'image' ? t.imageMode.inspectingBtn : t.progressTitle}
        </h3>
      </div>

      <ol className="divide-y divide-hairline">
        {steps.map((label, idx) => {
          const isDone = idx < activeStep;
          const isCurrent = idx === activeStep;
          return (
            <li
              key={label}
              className={`flex items-center gap-3 py-3 text-sm sm:text-[15px] ${
                isCurrent ? 'font-bold text-ink' : isDone ? 'text-ink' : 'text-muted'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-brand" strokeWidth={1.75} aria-hidden="true" />
              ) : isCurrent ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-brand" aria-hidden="true" />
              ) : (
                <span className="h-5 w-5 shrink-0 rounded-full border-[1.5px] border-hairline" />
              )}
              <span className="min-w-0">{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
