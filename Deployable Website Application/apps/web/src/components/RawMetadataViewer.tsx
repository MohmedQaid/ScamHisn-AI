import { useState } from 'react';
import { Check, ChevronDown, Code2, Copy } from 'lucide-react';
import { useLocale } from '../i18n/LocaleContext';

interface RawMetadataViewerProps {
  result: unknown;
}

export function RawMetadataViewer({ result }: RawMetadataViewerProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(result, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <section className="box overflow-hidden">
      <div className="flex items-center justify-between gap-3 py-2 pe-2 ps-4 sm:ps-5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 py-2 text-start"
        >
          <Code2 className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.75} aria-hidden="true" />
          <span className="min-w-0 text-sm font-bold text-ink sm:text-[15px]">{t.labels.rawMetadataTitle}</span>
          <ChevronDown
            className={`ms-auto h-[18px] w-[18px] shrink-0 text-muted transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </button>

        <button type="button" onClick={handleCopy} className="btn btn-outline btn-sm shrink-0">
          {copied ? (
            <Check className="h-4 w-4 text-brand" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          )}
          <span>{copied ? t.labels.copiedJson : t.labels.copyJson}</span>
        </button>
      </div>

      {open && (
        <div className="border-t border-hairline p-3 sm:p-4">
          <pre
            dir="ltr"
            className="max-h-96 overflow-auto rounded-ctl bg-page p-4 text-start font-mono text-xs leading-relaxed text-ink"
          >
            {jsonString}
          </pre>
        </div>
      )}
    </section>
  );
}
