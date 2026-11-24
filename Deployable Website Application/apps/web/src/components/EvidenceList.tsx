import { useId, useState, type ComponentType } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Severity } from '@scamhisn/shared';
import { useLocale } from '../i18n/LocaleContext';

export interface EvidenceItem {
  key: string;
  Icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  severity: Severity;
  title: string;
  detail: string;
}

const SEVERITY_TEXT: Record<Severity, string> = {
  critical: 'text-danger',
  high: 'text-danger',
  medium: 'text-warn',
  low: 'text-muted',
  info: 'text-muted',
};

/** How many findings show before the "Show all" control. */
const VISIBLE_BY_DEFAULT = 4;

/**
 * Findings as plain rows split by hairlines: icon, one sentence, chevron.
 * A row opens on click / Enter / Space to show its detail text.
 */
export function EvidenceList({ items }: { items: EvidenceItem[] }) {
  const { t } = useLocale();
  const baseId = useId();
  const [openKeys, setOpenKeys] = useState<Set<string>>(() => new Set());
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? items : items.slice(0, VISIBLE_BY_DEFAULT);
  const hasMore = items.length > VISIBLE_BY_DEFAULT;

  const toggle = (key: string) =>
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div>
      <ul className="divide-y divide-hairline border-y border-hairline">
        {visible.map((item, idx) => {
          const open = openKeys.has(item.key);
          const detailId = `${baseId}-detail-${idx}`;
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => toggle(item.key)}
                aria-expanded={open}
                aria-controls={detailId}
                className="flex w-full cursor-pointer items-center gap-4 py-4 text-start transition-colors hover:text-brand"
              >
                <item.Icon
                  className={`h-6 w-6 shrink-0 ${SEVERITY_TEXT[item.severity]}`}
                  strokeWidth={1.6}
                />
                <span className="min-w-0 flex-1 break-words text-base font-bold leading-snug text-ink sm:text-[17px]">
                  {item.title}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </button>
              <div id={detailId} hidden={!open} className="pb-4 ps-10 pe-9">
                <p className="break-words text-sm leading-relaxed text-muted sm:text-[15px]">
                  <span className={`font-bold ${SEVERITY_TEXT[item.severity]}`}>{t.severity[item.severity]}</span>
                  <span aria-hidden="true"> · </span>
                  {item.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
          className="text-link mt-3 text-sm text-brand"
        >
          {showAll ? t.evidence.showFewer : t.evidence.showAll.replace('{count}', String(items.length))}
        </button>
      )}
    </div>
  );
}
