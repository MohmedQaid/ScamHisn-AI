import { useEffect, useState } from 'react';
import type { VerdictLevel } from '@scamhisn/shared';

interface RiskGaugeProps {
  score: number;
  verdict: VerdictLevel;
}

const VERDICT_STYLES: Record<
  VerdictLevel,
  {
    stroke: string;
    glow: string;
    textColor: string;
  }
> = {
  safe: {
    stroke: '#10b981',
    glow: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.3))',
    textColor: 'text-emerald-600 dark:text-emerald-400',
  },
  caution: {
    stroke: '#d97706',
    glow: 'drop-shadow(0 0 8px rgba(217, 119, 6, 0.3))',
    textColor: 'text-amber-600 dark:text-amber-400',
  },
  suspicious: {
    stroke: '#ea580c',
    glow: 'drop-shadow(0 0 8px rgba(234, 88, 12, 0.35))',
    textColor: 'text-orange-600 dark:text-orange-400',
  },
  high_risk: {
    stroke: '#e11d48',
    glow: 'drop-shadow(0 0 10px rgba(225, 29, 72, 0.4))',
    textColor: 'text-rose-600 dark:text-rose-400',
  },
  confirmed_scam: {
    stroke: '#be123c',
    glow: 'drop-shadow(0 0 12px rgba(190, 18, 60, 0.55))',
    textColor: 'text-rose-700 dark:text-rose-400',
  },
};

/**
 * Compact, minimal animated circular 0–100% risk ring designed for clean end-user readability.
 */
export function RiskGauge({ score, verdict }: RiskGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let rafId = 0;
    const duration = 650;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(score * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [score]);

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, displayScore));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;
  const style = VERDICT_STYLES[verdict];

  return (
    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
      <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 92 92">
        <circle
          cx="46"
          cy="46"
          r={radius}
          strokeWidth="7.5"
          fill="none"
          className="stroke-slate-200/85 dark:stroke-slate-800/90"
        />
        <circle
          cx="46"
          cy="46"
          r={radius}
          strokeWidth="7.5"
          fill="none"
          strokeLinecap="round"
          stroke={style.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            filter: style.glow,
            transition: 'stroke-dashoffset 0.15s ease-out',
          }}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-mono text-2xl font-extrabold tracking-tight ${style.textColor}`}>
          {displayScore}
          <span className="text-sm font-bold">%</span>
        </span>
      </div>
    </div>
  );
}
