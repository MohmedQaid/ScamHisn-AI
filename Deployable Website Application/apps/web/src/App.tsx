import { useState } from 'react';
import { Download, ShieldCheck, Users } from 'lucide-react';
import type { ScanMode, ScanResponse } from '@scamhisn/shared';
import { LocaleProvider, useLocale } from './i18n/LocaleContext';
import { TEAM_MEMBERS } from './i18n/translations';
import { ThemeProvider } from './theme/ThemeContext';
import { ApiClientError, scanUrl } from './api/client';
import { Header } from './components/Header';
import { HisnLogo } from './components/HisnLogo';
import { ScanForm } from './components/ScanForm';
import { ScanProgress } from './components/ScanProgress';
import { ResultsDashboard } from './components/ResultsDashboard';

function ScamHisnShell() {
  const { locale, t } = useLocale();
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<ScanMode>('general');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResponse | null>(null);

  const handleScan = async (targetUrl: string, targetMode: ScanMode) => {
    setIsScanning(true);
    setError(null);

    try {
      const response = await scanUrl({ url: targetUrl, mode: targetMode, locale });
      setResult(response);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(locale === 'ar' && err.messageAr ? err.messageAr : err.message);
      } else {
        setError(
          locale === 'ar'
            ? 'تعذّر الاتصال بخادم الفحص. تأكد من تشغيل الخدمة وحاول مرة ثانية.'
            : err instanceof Error
              ? err.message
              : 'Failed to reach the inspection server.',
        );
      }
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="bg-hisn-pattern relative flex min-h-screen flex-col overflow-x-clip">
      <div className="bg-hisn-aura pointer-events-none fixed inset-0 -z-10" />

      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        {/* Centered Gemini / ChatGPT-Style Brand Title + Minimal Instruction */}
        <div className="mx-auto mb-7 max-w-2xl text-center">
          <div className="inline-flex items-center justify-center gap-3">
            <HisnLogo className="h-11 w-11 drop-shadow-md sm:h-12 sm:w-12" />
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              {t.brandName}
            </h1>
          </div>
          <p className="mt-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 sm:text-base">
            {t.heroTitle}
          </p>
        </div>

        {/* Inspection Form */}
        <ScanForm
          url={url}
          mode={mode}
          isScanning={isScanning}
          error={error}
          onUrlChange={setUrl}
          onModeChange={setMode}
          onSubmit={handleScan}
        />

        {/* Progress or Results */}
        {isScanning ? (
          <ScanProgress />
        ) : (
          result && <ResultsDashboard key={result.scanId} result={result} />
        )}
      </main>

      {/* Bottom Important Notes, Team Cybersound & Compact Desktop Extension Link */}
      <footer className="border-t border-slate-200/80 bg-white/75 py-8 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#070c10]/85">
        <div className="mx-auto max-w-5xl space-y-4 px-4 text-xs sm:px-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Team Cybersound */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-[#0e161e]/80">
              <div className="mb-2 flex items-center gap-2 text-slate-900 dark:text-white">
                <Users className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                <span className="font-extrabold">{t.footer.teamName}</span>
              </div>
              <p className="mb-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {t.footer.membersLabel}:
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {TEAM_MEMBERS.map((member) => (
                  <li
                    key={member}
                    dir="ltr"
                    className="rounded-full border border-slate-200/90 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-300"
                  >
                    {member}
                  </li>
                ))}
              </ul>
            </div>

            {/* Important Application Notes + API v1 Ready Note */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-[#0e161e]/80">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {t.footer.notesTitle}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{t.footer.apiNoteLabel}</span>
                  <span dir="ltr" className="inline-block font-mono text-[10.5px]">
                    /api/v1/scan
                  </span>
                </span>
              </div>
              <ul className="space-y-1.5 leading-relaxed text-slate-600 dark:text-slate-400">
                <li>• {t.footer.apiNoteDesc}</li>
                <li>• {t.footer.sandboxNote}</li>
                <li>• {t.footer.privacyNote}</li>
              </ul>
            </div>
          </div>

          {/* Very End of Page: Compact Desktop-Only Chrome Extension Strip */}
          <div className="flex flex-col items-start justify-between gap-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center dark:border-slate-800/90 dark:bg-[#0e161e]/70">
            <div className="min-w-0 space-y-0.5">
              <p className="font-semibold text-slate-700 dark:text-slate-200">
                {t.footer.extensionDesktopOnly}
              </p>
              <p className="break-words text-[11px] text-slate-500 dark:text-slate-400">
                {t.footer.extensionBriefSteps}
              </p>
            </div>

            <a
              href="/scamhisn-extension.zip"
              download="scamhisn-extension.zip"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-emerald-500/35 bg-emerald-50/80 px-3.5 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100/80 dark:border-emerald-400/30 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{t.footer.downloadExtensionBtn}</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <ScamHisnShell />
      </LocaleProvider>
    </ThemeProvider>
  );
}
