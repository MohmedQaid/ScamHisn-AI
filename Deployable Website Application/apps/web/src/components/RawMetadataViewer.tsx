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
    <section className="rounded-3xl border border-slate-200/90 bg-white shadow-xs dark:border-slate-800 dark:bg-[#0e161e]">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex flex-1 cursor-pointer items-center gap-2.5 text-start focus:outline-none"
        >
          <Code2 className="h-4.5 w-4.5 text-emerald-700 dark:text-emerald-400" />
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {t.labels.rawMetadataTitle}
          </span>
          <ChevronDown
            className={`ms-auto h-4.5 w-4.5 text-slate-400 transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-emerald-500/60 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:text-emerald-300"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? t.labels.copiedJson : t.labels.copyJson}</span>
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <pre
            dir="ltr"
            className="max-h-96 overflow-auto rounded-2xl bg-slate-950 p-4 font-mono text-xs leading-relaxed text-emerald-200"
          >
            {jsonString}
          </pre>
        </div>
      )}
    </section>
  );
}
