import React, { useEffect, useRef, useState } from 'react';
import {
  Briefcase,
  ClipboardPaste,
  Image as ImageIcon,
  Link2,
  Loader2,
  MapPin,
  RefreshCw,
  SearchCheck,
  ShieldAlert,
  Sparkles,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import type { ScanMode } from '@scamhisn/shared';
import { useLocale } from '../i18n/LocaleContext';
import { compressImageForScan, type CompressedImagePayload } from '../utils/imageCompress';

export type InspectorTab = ScanMode | 'image';

interface ScanFormProps {
  url: string;
  mode: InspectorTab;
  selectedImage: CompressedImagePayload | null;
  isScanning: boolean;
  error: string | null;
  onUrlChange: (value: string) => void;
  onModeChange: (mode: InspectorTab) => void;
  onImageSelect: (image: CompressedImagePayload | null) => void;
  onError: (msg: string | null) => void;
  onSubmitUrl: (url: string, mode: ScanMode) => void;
  onSubmitImage: (image: CompressedImagePayload) => void;
}

const URL_MODE_META: Array<{ id: ScanMode; Icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'general', Icon: Link2 },
  { id: 'job', Icon: Briefcase },
  { id: 'map', Icon: MapPin },
];

export function ScanForm({
  url,
  mode,
  selectedImage,
  isScanning,
  error,
  onUrlChange,
  onModeChange,
  onImageSelect,
  onError,
  onSubmitUrl,
  onSubmitImage,
}: ScanFormProps) {
  const { t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const processFile = async (file: File | null | undefined) => {
    if (!file || isScanning) return;
    setIsCompressing(true);
    onError(null);
    try {
      const compressed = await compressImageForScan(file);
      onImageSelect(compressed);
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'UNSUPPORTED_IMAGE_TYPE') {
        onError(t.imageMode.errUnsupported);
      } else if (code === 'IMAGE_FILE_TOO_LARGE') {
        onError(t.imageMode.errTooLarge);
      } else {
        onError(t.imageMode.errFailedRead);
      }
    } finally {
      setIsCompressing(false);
    }
  };

  // Allow Ctrl+V / Cmd+V screenshot pasting directly when Image Check mode is active
  useEffect(() => {
    if (mode !== 'image') return;
    const handleWindowPaste = (e: ClipboardEvent) => {
      if (isScanning) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            void processFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handleWindowPaste);
    return () => window.removeEventListener('paste', handleWindowPaste);
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isScanning) return;
    if (mode === 'image') {
      if (selectedImage) {
        onSubmitImage(selectedImage);
      }
      return;
    }
    if (!url.trim()) return;
    onSubmitUrl(url.trim(), mode);
  };

  const handlePasteUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) onUrlChange(text.trim());
    } catch {
      // Clipboard API requires user gesture/permission in some browsers
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    void processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    void processFile(file);
  };

  const isImageMode = mode === 'image';

  return (
    <section className="mx-auto w-full max-w-4xl">
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-4 shadow-xl shadow-slate-900/[0.04] backdrop-blur-md transition-colors dark:border-slate-800/90 dark:bg-[#0e161e]/95 dark:shadow-black/40 sm:p-6">
        {/* Mode Selector: 2x2 on phones, 4-across on desktop */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t.modePrompt}
          </p>
          <div
            className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4"
            role="radiogroup"
            aria-label={t.modePrompt}
          >
            {URL_MODE_META.map(({ id, Icon }) => {
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
                  className={`group flex min-w-0 cursor-pointer items-center gap-2 rounded-xl border px-2 py-2.5 text-start transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:gap-2.5 sm:px-3 ${
                    selected
                      ? 'border-emerald-600/80 bg-emerald-50/75 ring-1 ring-emerald-600/20 dark:border-emerald-400/70 dark:bg-emerald-950/45 dark:ring-emerald-400/20'
                      : 'border-slate-200/90 bg-slate-50/50 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700 dark:hover:bg-slate-900/70'
                  }`}
                >
                  <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors sm:h-8 sm:w-8 ${
                      selected
                        ? 'bg-emerald-700 text-white dark:bg-emerald-500 dark:text-slate-950'
                        : 'bg-white text-slate-600 ring-1 ring-slate-200 group-hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:group-hover:text-emerald-300'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                      {info.label}
                    </span>
                    <span className="block truncate text-[10.5px] text-slate-500 dark:text-slate-400 sm:text-[11px]">
                      {info.shortDesc}
                    </span>
                  </div>
                </button>
              );
            })}

            {/* 4th Mode: Image / Screenshot Authenticity Check */}
            <button
              type="button"
              role="radio"
              aria-checked={isImageMode}
              onClick={() => onModeChange('image')}
              disabled={isScanning}
              className={`group flex min-w-0 cursor-pointer items-center gap-2 rounded-xl border px-2 py-2.5 text-start transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:gap-2.5 sm:px-3 ${
                isImageMode
                  ? 'border-emerald-600/80 bg-emerald-50/75 ring-1 ring-emerald-600/20 dark:border-emerald-400/70 dark:bg-emerald-950/45 dark:ring-emerald-400/20'
                  : 'border-slate-200/90 bg-slate-50/50 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700 dark:hover:bg-slate-900/70'
              }`}
            >
              <span
                className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors sm:h-8 sm:w-8 ${
                  isImageMode
                    ? 'bg-emerald-700 text-white dark:bg-emerald-500 dark:text-slate-950'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 group-hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:group-hover:text-emerald-300'
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>

              <div className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                  {t.imageMode.label}
                </span>
                <span className="block truncate text-[10.5px] text-slate-500 dark:text-slate-400 sm:text-[11px]">
                  {t.imageMode.shortDesc}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Dynamic Input Body: URL Scanner vs. Image Uploader & Preview */}
        {!isImageMode ? (
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
                  onClick={handlePasteUrl}
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
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-3.5">
            <input
              ref={fileInputRef}
              id="scamhisn-image-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={isScanning || isCompressing}
              className="sr-only"
            />

            {!selectedImage ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!isScanning) setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => !isScanning && !isCompressing && fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isScanning && !isCompressing) {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-all sm:px-6 ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/70 dark:border-emerald-400 dark:bg-emerald-950/40'
                    : 'border-slate-300/90 bg-slate-50/65 hover:border-emerald-500/70 hover:bg-emerald-50/35 dark:border-slate-700 dark:bg-[#091017] dark:hover:border-emerald-400/60 dark:hover:bg-emerald-950/25'
                }`}
              >
                <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100/90 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400">
                  {isCompressing ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <UploadCloud className="h-6 w-6" />
                  )}
                </span>

                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.imageMode.uploadTitle}
                </p>
                <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                  {t.imageMode.uploadHint}
                </p>

                <span className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-white px-4 py-2 text-xs font-bold text-emerald-800 shadow-xs transition-colors hover:bg-emerald-50 dark:border-emerald-400/35 dark:bg-slate-900 dark:text-emerald-300">
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>{t.imageMode.chooseFileBtn}</span>
                </span>
              </div>
            ) : (
              /* Dedicated Visible Uploaded Image Preview Area */
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/75 p-3.5 dark:border-slate-700/80 dark:bg-[#091017] sm:p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-600/15 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300">
                      <ImageIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                      {t.imageMode.previewLabel}
                    </span>
                    <span
                      dir="ltr"
                      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-50 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-950/60 dark:text-emerald-300"
                    >
                      <Sparkles className="h-2.5 w-2.5" />
                      {selectedImage.compressedKb} KB · {t.imageMode.optimizedTag}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isScanning}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors hover:border-emerald-500/50 hover:text-emerald-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>{t.imageMode.changeBtn}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isScanning}
                      onClick={() => onImageSelect(null)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-rose-200/90 bg-rose-50/70 px-2.5 py-1 text-[11px] font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>{t.imageMode.removeBtn}</span>
                    </button>
                  </div>
                </div>

                {/* Framed Image Canvas */}
                <div className="flex min-h-[160px] items-center justify-center overflow-hidden rounded-xl border border-slate-200/90 bg-white p-2 dark:border-slate-800 dark:bg-slate-950/80">
                  <img
                    src={selectedImage.previewDataUrl}
                    alt={selectedImage.fileName}
                    className="max-h-64 w-auto max-w-full rounded-lg object-contain"
                  />
                </div>

                {/* Footer bar: file info + Inspect Image button */}
                <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p
                      dir="ltr"
                      className="truncate font-mono text-xs font-medium text-slate-600 dark:text-slate-300"
                      title={selectedImage.fileName}
                    >
                      {selectedImage.fileName}
                    </p>
                    <p dir="ltr" className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                      {selectedImage.width}×{selectedImage.height}px · {selectedImage.originalKb} KB →{' '}
                      {selectedImage.compressedKb} KB
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isScanning}
                    className="inline-flex h-11 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00734B] via-[#059669] to-[#047857] px-6 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 dark:from-emerald-600 dark:via-emerald-500 dark:to-teal-500 dark:text-slate-950 dark:shadow-emerald-950/50 sm:w-auto"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        <span>{t.imageMode.inspectingBtn}</span>
                      </>
                    ) : (
                      <>
                        <SearchCheck className="h-4.5 w-4.5" />
                        <span>{t.imageMode.inspectBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {/* Validation / SSRF / Network Error Banner */}
        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/50 dark:text-rose-200"
          >
            <ShieldAlert className="mt-0.5 h-4.5 w-4.5 shrink-0 text-rose-600 dark:text-rose-400" />
            <p className="min-w-0 break-words leading-relaxed">{error}</p>
          </div>
        )}
      </div>
    </section>
  );
}
