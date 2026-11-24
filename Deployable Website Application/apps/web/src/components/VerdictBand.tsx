import { useLayoutEffect, useRef, useState } from 'react';
import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import type { VerdictLevel } from '@scamhisn/shared';

interface VerdictBandProps {
  verdict: VerdictLevel;
  /** 0–100 scam likelihood. */
  score: number;
  /** Verdict label, already translated (the caller decides when it is "Incomplete check"). */
  label: string;
  /** One plain sentence under the verdict. */
  sentence: string;
  /** Accessible name for the number, e.g. "Scam Likelihood". */
  scoreLabel: string;
  /** A clean result that did not run in full: shown in amber, never as a confident "safe". */
  incomplete?: boolean;
}

type Tone = 'danger' | 'warn' | 'safe';

const TONE_STYLES: Record<Tone, { band: string; text: string }> = {
  danger: { band: 'bg-danger-tint', text: 'text-danger' },
  warn: { band: 'bg-warn-tint', text: 'text-warn' },
  safe: { band: 'bg-brand-tint', text: 'text-brand' },
};

function toneFor(verdict: VerdictLevel, incomplete: boolean): Tone {
  if (incomplete) return 'warn';
  if (verdict === 'high_risk' || verdict === 'confirmed_scam') return 'danger';
  if (verdict === 'suspicious' || verdict === 'caution') return 'warn';
  return 'safe';
}

const LABEL_TYPE = 'text-2xl font-extrabold leading-tight sm:text-4xl';

/**
 * The verdict at a glance: tinted band, shield, huge percentage, divider, label, one sentence.
 * Shared by link results and screenshot results. When the label cannot sit beside the
 * percentage (narrow phones, long labels) it drops underneath and the divider goes away.
 */
export function VerdictBand({
  verdict,
  score,
  label,
  sentence,
  scoreLabel,
  incomplete = false,
}: VerdictBandProps) {
  const tone = toneFor(verdict, incomplete);
  const styles = TONE_STYLES[tone];
  const Icon = incomplete ? ShieldQuestion : tone === 'safe' ? ShieldCheck : ShieldAlert;

  const rowRef = useRef<HTMLDivElement | null>(null);
  const scoreRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const [stacked, setStacked] = useState(false);

  useLayoutEffect(() => {
    const row = rowRef.current;
    const scoreEl = scoreRef.current;
    const measure = measureRef.current;
    if (!row || !scoreEl || !measure) return undefined;

    const check = () => {
      // Divider (1px) plus the row gap on each side of it (gap-5 on phones, gap-6 from sm up)
      const gap = window.matchMedia('(min-width: 640px)').matches ? 24 : 20;
      const needed = scoreEl.offsetWidth + measure.offsetWidth + gap * 2 + 1;
      setStacked(needed > row.clientWidth);
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(row);
    // Web fonts change the widths once they arrive
    void document.fonts?.ready.then(check).catch(() => undefined);
    return () => observer.disconnect();
  }, [label, score]);

  return (
    <section className={`relative overflow-hidden rounded-box px-4 py-8 text-center sm:px-10 sm:py-10 ${styles.band}`}>
      {/* Off-screen copy of the label, used only to measure its natural width */}
      <span
        ref={measureRef}
        aria-hidden="true"
        className={`pointer-events-none invisible absolute start-0 top-0 whitespace-nowrap ${LABEL_TYPE}`}
      >
        {label}
      </span>

      <div
        ref={rowRef}
        className={`flex items-center justify-center ${stacked ? 'flex-col gap-3' : 'flex-row gap-5 sm:gap-6'}`}
      >
        <div ref={scoreRef} className={`flex shrink-0 items-center gap-3 sm:gap-5 ${styles.text}`}>
          <Icon className="h-12 w-12 shrink-0 sm:h-[76px] sm:w-[76px]" strokeWidth={1.5} aria-hidden="true" />
          <p dir="ltr" className="text-[58px] font-extrabold leading-none tracking-tight sm:text-[92px]">
            <span className="sr-only">{scoreLabel}: </span>
            {score}%
          </p>
        </div>

        {!stacked && <span aria-hidden="true" className="w-px self-stretch bg-ink/25" />}

        <p className={`min-w-0 text-ink ${LABEL_TYPE}`}>{label}</p>
      </div>

      <p className="mx-auto mt-5 max-w-2xl break-words px-1 text-base leading-relaxed text-ink/85 sm:text-lg">
        {sentence}
      </p>
    </section>
  );
}
