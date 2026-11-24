import { Globe } from 'lucide-react';
import { useLocale } from '../i18n/LocaleContext';
import { ThemeToggle } from './ThemeToggle';
import { HisnLogo } from './HisnLogo';

export function Header() {
  const { locale, t, toggleLocale } = useLocale();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl transition-colors dark:border-slate-800/70 dark:bg-[#070c10]/75">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        {/* Subtle Corner Mark */}
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-800 transition-opacity hover:opacity-85 dark:text-slate-100"
        >
          <HisnLogo className="h-7 w-7 drop-shadow-xs" />
          <span className="tracking-tight">{t.brandName}</span>
        </a>

        {/* Language Switcher + Animated Theme Toggle */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleLocale}
            aria-label={locale === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:border-emerald-500/50 hover:text-emerald-700 dark:border-slate-700/80 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:border-emerald-400/50 dark:hover:text-emerald-300"
          >
            <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{locale === 'en' ? 'العربية 🇦🇪' : 'English'}</span>
          </button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
