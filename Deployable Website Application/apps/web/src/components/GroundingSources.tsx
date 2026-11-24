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
    <section>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-base font-extrabold text-ink">{t.groundingSourcesTitle}</h3>
        {groundingUsed.length > 0 && (
          <p dir="ltr" className="font-mono text-xs text-muted">
            {groundingUsed.join(' · ')}
          </p>
        )}
      </div>

      <ul className="divide-y divide-hairline border-y border-hairline">
        {sources.map((src) => (
          <li key={src.uri}>
            <a
              href={src.uri}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex items-center gap-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:text-brand"
            >
              {src.sourceType === 'maps' ? (
                <MapPin className="h-[18px] w-[18px] shrink-0 text-brand" strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <Globe className="h-[18px] w-[18px] shrink-0 text-brand" strokeWidth={1.75} aria-hidden="true" />
              )}
              <span className="min-w-0 flex-1 truncate">{src.title}</span>
              <ExternalLink className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.75} aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
