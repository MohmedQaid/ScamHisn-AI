import React from 'react';
import {
  Briefcase,
  ClipboardPaste,
  Link2,
  Loader2,
  MapPin,
  SearchCheck,
  ShieldAlert,
} from 'lucide-react';
import type { ScanMode } from '@scamhisn/shared';
import { useLocale } from '../i18n/LocaleContext';

interface ScanFormProps {
  url: string;
  mode: ScanMode;
  isScanning: boolean;
  error: string | null;
  onUrlChange: (value: string) => void;
  onModeChange: (mode: ScanMode) => void;
  onSubmit: (url: string, mode: ScanMode) => void;
}

const MODE_META: Array<{ id: ScanMode; Icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'general', Icon: Link2 },
  { id: 'job', Icon: Briefcase },
  { id: 'map', Icon: MapPin },
];

export function ScanForm({
  url,
  mode,
  isScanning,
  error,
  onUrlChange,
  onModeChange,
  onSubmit,
}: ScanFormProps) {
  const { t } = useLocale();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isScanning) return;
    onSubmit(url.trim(), mode);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) onUrlChange(text.trim());
    } catch {
      // Clipboard API requires user gesture/permission in some browsers
    }
  };

  return (
    <section className="mx-auto w-full max-w-4xl">
      <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-4 shadow-xl shadow-slate-900/[0.04] backdrop-blur-md transition-colors dark:border-slate-800/90 dark:bg-[#0e161e]/95 dark:shadow-black/40 sm:p-6">
        {/* Compact Mode Selector */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t.modePrompt}
          </p>
          <div
            className="grid grid-cols-1 gap-2 sm:grid-cols-3"
            role="radiogroup"
            aria-label={t.modePrompt}
          >
            {MODE_META.map(({ id, Icon }) => {
              const selected = mode === id;
              const info = t.modes[id];
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onModeChange(id)}
                  disabled={isScanning}
                  className={`group flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-start transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    selected
                      ? 'border-emerald-600/80 bg-emerald-50/75 ring-1 ring-emerald-600/20 dark:border-emerald-400/70 dark:bg-emerald-950/45 dark:ring-emerald-400/20'
                      : 'border-slate-200/90 bg-slate-50/50 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700 dark:hover:bg-slate-900/70'
                  }`}
                >
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      selected
                        ? 'bg-emerald-700 text-white dark:bg-emerald-500 dark:text-slate-950'
                        : 'bg-white text-slate-600 ring-1 ring-slate-200 group-hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:group-hover:text-emerald-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                      {info.label}
                    </span>
                    <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                      {info.shortDesc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* URL Input + Submit */}
        <form onSubmit={handleFormSubmit} className="space-y-3">
          <label htmlFor="scamhisn-url-input" className="sr-only">
            {t.urlLabel}
          </label>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="relative flex-1">
              <input
                id="scamhisn-url-input"
                type="text"
                dir="ltr"
                value={url}
                onChange={(e) => onUrlChange(e.target.value)}
                placeholder={t.modes[mode].placeholder}
                disabled={isScanning}
                autoComplete="off"
                spellCheck={false}
                className="h-12 w-full rounded-2xl border border-slate-300/90 bg-slate-50/70 px-4 pe-22 font-mono text-sm text-slate-900 placeholder:font-sans placeholder:text-slate-400 transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/15 disabled:opacity-60 dark:border-slate-700 dark:bg-[#091017] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:bg-[#0b131b]"
              />
              <button
                type="button"
                onClick={handlePaste}
                disabled={isScanning}
                className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-emerald-500/50 hover:text-emerald-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-emerald-300"
                title={t.pasteBtn}
              >
                <ClipboardPaste className="h-3.5 w-3.5" />
                <span>{t.pasteBtn}</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isScanning || !url.trim()}
              className="inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00734B] via-[#059669] to-[#047857] px-6 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 dark:from-emerald-600 dark:via-emerald-500 dark:to-teal-500 dark:text-slate-950 dark:shadow-emerald-950/50"
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>{t.scanningBtn}</span>
                </>
              ) : (
                <>
                  <SearchCheck className="h-4.5 w-4.5" />
                  <span>{t.scanBtn}</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Sample Links */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-slate-500 dark:text-slate-400">
            <span>{t.trySampleLabel}</span>
            {t.samples.map((sample) => (
              <button
                key={sample.url}
                type="button"
                disabled={isScanning}
                onClick={() => {
                  onModeChange(sample.mode);
                  onUrlChange(sample.url);
                }}
                className="cursor-pointer rounded-full border border-slate-200/90 bg-slate-100/70 px-3 py-1 font-medium text-slate-700 transition-colors hover:border-emerald-500/50 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50 dark:border-slate-700/80 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-emerald-400/50 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </form>

        {/* Validation / SSRF / Network Error Banner */}
        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/50 dark:text-rose-200"
          >
            <ShieldAlert className="mt-0.5 h-4.5 w-4.5 shrink-0 text-rose-600 dark:text-rose-400" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}
      </div>
    </section>
  );
}
