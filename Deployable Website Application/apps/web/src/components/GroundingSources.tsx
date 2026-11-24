import { ExternalLink, Globe, MapPin } from 'lucide-react';
import type { GroundingSource } from '@scamhisn/shared';
import { useLocale } from '../i18n/LocaleContext';

interface GroundingSourcesProps {
  sources: GroundingSource[];
  groundingUsed: string[];
}

export function GroundingSources({ sources, groundingUsed }: GroundingSourcesProps) {
  const { t } = useLocale();
  if (sources.length === 0) return null;

  return (
    <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800/80">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
          {t.groundingSourcesTitle}
        </span>
        <div className="flex items-center gap-1.5">
          {groundingUsed.map((g) => (
            <span
              key={g}
              className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              {g}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {sources.map((src) => (
          <a
            key={src.uri}
            href={src.uri}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex max-w-xs items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-emerald-500/60 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-400/60 dark:hover:text-emerald-300"
          >
            {src.sourceType === 'maps' ? (
              <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Globe className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            )}
            <span className="truncate">{src.title}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
          </a>
        ))}
      </div>
    </div>
  );
}
