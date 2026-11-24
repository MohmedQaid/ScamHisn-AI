import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  ClipboardPaste,
  Image as ImageIcon,
  Link2,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import type { AiCapabilities, ScanMode } from '@scamhisn/shared';
import { useLocale } from '../i18n/LocaleContext';
import { compressImageForScan, type CompressedImagePayload } from '../utils/imageCompress';

export type InspectorTab = ScanMode | 'image';

/** Ticks once a second while a cool-down is counting down, so "back in 1 min 20 s" stays current. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);
  return now;
}

function formatRemaining(ms: number, locale: 'en' | 'ar'): string {
  const total = Math.max(1, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (locale === 'ar') {
    return minutes > 0 ? `${minutes} د ${seconds} ث` : `${seconds} ث`;
  }
  return minutes > 0 ? `${minutes} min ${seconds} s` : `${seconds} s`;
}

interface ScanFormProps {
  url: string;
  mode: InspectorTab;
  selectedImage: CompressedImagePayload | null;
  isScanning: boolean;
  error: string | null;
  /** Null until the first health check answers; then says which features can run right now. */
  capabilities: AiCapabilities | null;
  onUrlChange: (value: string) => void;
  onModeChange: (mode: InspectorTab) => void;
  onImageSelect: (image: CompressedImagePayload | null) => void;
  onError: (msg: string | null) => void;
  onSubmitUrl: (url: string, mode: ScanMode) => void;
  onSubmitImage: (image: CompressedImagePayload) => void;
}

const TAB_META: Array<{
  id: InspectorTab;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}> = [
  { id: 'general', Icon: Link2 },
  { id: 'job', Icon: Briefcase },
  { id: 'map', Icon: MapPin },
  { id: 'image', Icon: ImageIcon },
];

export function ScanForm({
  url,
  mode,
  selectedImage,
  isScanning,
  error,
  capabilities,
  onUrlChange,
  onModeChange,
  onImageSelect,
  onError,
  onSubmitUrl,
  onSubmitImage,
}: ScanFormProps) {
  const { t, locale } = useLocale();

  // A feature that needs Gemini is paused while every Gemini key is cooling down
  const featureState = capabilities?.features[mode] ?? null;
  const modePaused = featureState !== null && !featureState.available;
  const isPaused = (tab: InspectorTab) => capabilities !== null && !capabilities.features[tab].available;
  const now = useNow(modePaused && Boolean(featureState?.retryAt));
  const remainingMs = featureState?.retryAt ? Date.parse(featureState.retryAt) - now : null;
  const pausedText = modePaused
    ? [
        featureState?.reason === 'gemini_not_configured' ? t.availability.notConfigured : t.availability.coolingDown,
        featureState?.reason === 'gemini_cooling_down'
          ? remainingMs !== null && remainingMs > 0
            ? t.availability.backIn.replace('{time}', formatRemaining(remainingMs, locale))
            : t.availability.backSoon
          : '',
        t.availability.generalStillWorks,
      ]
        .filter(Boolean)
        .join(' ')
    : null;
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
    <section className="w-full">
      {/* The one outlined row: link input, or the screenshot picker. The tabs sit under it and never move. */}
      {!isImageMode ? (
        <form onSubmit={handleFormSubmit}>
          <label htmlFor="scamhisn-url-input" className="sr-only">
            {t.urlLabel}
          </label>
          <div className="flex flex-col gap-3 sm:box sm:flex-row sm:items-center sm:gap-2 sm:p-2 sm:ps-5 sm:transition-colors sm:has-[input:focus]:border-brand">
            <div className="flex h-14 min-w-0 flex-1 items-center gap-3 max-sm:box max-sm:pe-1.5 max-sm:ps-4 max-sm:has-[input:focus]:border-brand sm:h-12">
              <Link2 className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.75} aria-hidden="true" />
              <input
                id="scamhisn-url-input"
                type="text"
                dir="auto"
                value={url}
                onChange={(e) => onUrlChange(e.target.value)}
                placeholder={t.inputPlaceholder[mode]}
                disabled={isScanning}
                autoComplete="off"
                spellCheck={false}
                className="h-full min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-muted focus:outline-none disabled:opacity-60 sm:text-[17px] rtl:text-right"
              />
              <button
                type="button"
                onClick={handlePasteUrl}
                disabled={isScanning}
                title={t.pasteBtn}
                aria-label={t.pasteBtn}
                className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-[10px] text-muted transition-colors hover:bg-brand-tint hover:text-brand disabled:opacity-50"
              >
                <ClipboardPaste className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>

            <button
              type="submit"
              disabled={isScanning || !url.trim() || modePaused}
              className={`btn btn-primary h-14 shrink-0 px-7 text-base sm:h-12 ${
                !isScanning && !modePaused ? 'disabled:opacity-100' : ''
              }`}
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden="true" />
                  <span>{t.scanningBtn}</span>
                </>
              ) : (
                <>
                  <span>{t.checkBtn}</span>
                  <ArrowRight className="h-[18px] w-[18px] rtl:rotate-180" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleFormSubmit}>
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
              className={`flex min-h-[124px] cursor-pointer flex-col items-center justify-center gap-3 rounded-box border-[1.5px] border-dashed px-4 py-4 text-center transition-colors sm:min-h-[67px] sm:flex-row sm:justify-between sm:py-2 sm:pe-2 sm:ps-5 sm:text-start ${
                isDragging ? 'border-brand bg-brand-tint' : 'border-outline bg-surface hover:border-brand'
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                {isCompressing ? (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-brand" aria-hidden="true" />
                ) : (
                  <UploadCloud className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.75} aria-hidden="true" />
                )}
                <span className="min-w-0 text-base text-muted sm:text-[17px]">{t.imageMode.uploadTitle}</span>
              </span>

              <span className="btn btn-outline h-11 shrink-0 px-5 sm:h-12">
                <ImageIcon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
                <span>{t.imageMode.chooseFileBtn}</span>
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:box sm:flex-row sm:items-center sm:gap-2 sm:p-2 sm:ps-5">
              <div className="flex h-14 min-w-0 flex-1 items-center gap-3 max-sm:box max-sm:pe-1.5 max-sm:ps-4 sm:h-12">
                <ImageIcon className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.75} aria-hidden="true" />
                <p
                  dir="ltr"
                  className="min-w-0 flex-1 truncate text-left font-mono text-sm text-ink rtl:text-right"
                  title={selectedImage.fileName}
                >
                  {selectedImage.fileName}
                </p>
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => fileInputRef.current?.click()}
                  title={t.imageMode.changeBtn}
                  className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-[10px] px-2.5 text-sm font-bold text-muted transition-colors hover:bg-brand-tint hover:text-brand disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  <span className="max-sm:sr-only">{t.imageMode.changeBtn}</span>
                </button>
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => onImageSelect(null)}
                  title={t.imageMode.removeBtn}
                  className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-[10px] px-2.5 text-sm font-bold text-muted transition-colors hover:bg-danger-tint hover:text-danger disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  <span className="max-sm:sr-only">{t.imageMode.removeBtn}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isScanning}
                className="btn btn-primary h-14 shrink-0 px-7 text-base sm:h-12"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden="true" />
                    <span>{t.imageMode.inspectingBtn}</span>
                  </>
                ) : (
                  <>
                    <span>{t.imageMode.inspectBtn}</span>
                    <ArrowRight className="h-[18px] w-[18px] rtl:rotate-180" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      )}

      {/* Mode tabs: one row, thin dividers, the active one in emerald with an underline */}
      <div
        className="mt-5 grid grid-cols-4 divide-x divide-hairline sm:mt-7"
        role="radiogroup"
        aria-label={t.modePrompt}
      >
        {TAB_META.map(({ id, Icon }) => {
          const selected = mode === id;
          const paused = isPaused(id);
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onModeChange(id)}
              disabled={isScanning}
              title={id === 'image' ? t.imageMode.shortDesc : t.modes[id].shortDesc}
              className={`group flex min-w-0 cursor-pointer flex-col items-center px-1 pb-1 pt-2 transition-colors disabled:cursor-not-allowed ${
                selected ? 'text-brand' : 'text-muted hover:text-ink'
              }`}
            >
              <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.6} aria-hidden="true" />
              <span className="mt-1.5 flex max-w-full flex-col items-center gap-x-2 gap-y-1 sm:mt-2 sm:flex-row">
                <span className="text-center text-[13px] font-bold leading-tight sm:text-base">{t.tabs[id]}</span>
                {paused && (
                  <span className="rounded-[5px] bg-warn-tint px-1.5 py-px text-[10px] font-extrabold uppercase leading-normal tracking-wide text-warn rtl:tracking-normal">
                    {t.availability.pausedTag}
                  </span>
                )}
              </span>
              <span
                aria-hidden="true"
                className={`mt-2.5 h-[3px] w-14 rounded-full transition-colors ${
                  selected ? 'bg-brand' : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>

      {pausedText && (
        <div
          role="status"
          className="mt-5 flex items-start gap-2.5 rounded-ctl bg-warn-tint px-4 py-3 text-sm font-semibold text-ink"
        >
          <ShieldAlert className="mt-0.5 h-[18px] w-[18px] shrink-0 text-warn" strokeWidth={1.75} aria-hidden="true" />
          <p className="min-w-0 leading-relaxed">{pausedText}</p>
        </div>
      )}

      {!isImageMode ? (
        /* Quick samples: a quiet line of text */
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm text-muted">
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
              className={`text-link ${sample.tone === 'danger' ? 'text-danger' : 'text-ink'}`}
            >
              {sample.label}
            </button>
          ))}
        </div>
      ) : !selectedImage ? (
        <p className="mt-5 text-center text-sm text-muted">{t.imageMode.uploadHint}</p>
      ) : (
        /* Selected screenshot preview */
        <div className="box mt-5 p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-sm font-extrabold text-ink">{t.imageMode.previewLabel}</p>
            <p dir="ltr" className="font-mono text-xs text-muted">
              {selectedImage.width}×{selectedImage.height}px · {selectedImage.originalKb} KB →{' '}
              {selectedImage.compressedKb} KB · {t.imageMode.optimizedTag}
            </p>
          </div>
          <div className="flex min-h-[160px] items-center justify-center overflow-hidden rounded-ctl bg-page p-2">
            <img
              src={selectedImage.previewDataUrl}
              alt={selectedImage.fileName}
              className="max-h-64 w-auto max-w-full rounded-lg object-contain"
            />
          </div>
        </div>
      )}

      {/* Validation / SSRF / Network Error Banner */}
      {error && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-ctl bg-danger-tint px-4 py-3 text-sm font-semibold text-ink"
        >
          <ShieldAlert className="mt-0.5 h-[18px] w-[18px] shrink-0 text-danger" strokeWidth={1.75} aria-hidden="true" />
          <p className="min-w-0 break-words leading-relaxed">{error}</p>
        </div>
      )}
    </section>
  );
}
