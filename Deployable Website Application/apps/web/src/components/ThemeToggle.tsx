import { useTheme } from '../theme/ThemeContext';

/**
 * Custom animated Dark/Light pill switch with sun+clouds ↔ moon+twinkling stars micro-interactions.
 * Explicitly locked to dir="ltr" internally so thumb sliding works cleanly in both LTR & RTL layouts.
 */
export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light Mode' : 'Dark Mode'}
      dir="ltr"
      onClick={toggleTheme}
      className={`group relative inline-flex h-9 w-[68px] shrink-0 cursor-pointer items-center rounded-full p-1 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#070c10] ${
        isDark
          ? 'bg-gradient-to-r from-[#0c1629] via-[#12223d] to-[#1a2f50] shadow-[inset_0_1px_4px_rgba(0,0,0,0.65)] ring-1 ring-emerald-400/25'
          : 'bg-gradient-to-r from-[#7dd3fc] via-[#bae6fd] to-[#fef3c7] shadow-[inset_0_1px_3px_rgba(14,116,144,0.22)] ring-1 ring-amber-400/40'
      }`}
    >
      {/* Night sky twinkling micro-stars */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 overflow-hidden rounded-full transition-opacity duration-500 ${
          isDark ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="animate-twinkle absolute left-2.5 top-2 h-1 w-1 rounded-full bg-amber-200 shadow-[0_0_4px_#fde68a]" />
        <span className="animate-twinkle-delayed absolute left-5 top-5 h-1.5 w-1.5 rounded-full bg-emerald-200/90 shadow-[0_0_5px_#6ee7b7]" />
        <span className="animate-twinkle absolute left-7 top-2.5 h-[3px] w-[3px] rounded-full bg-white/80" />
      </span>

      {/* Daylight soft drifting clouds */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 overflow-hidden rounded-full transition-all duration-500 ${
          isDark ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <span className="absolute right-2.5 top-2.5 h-2 w-4 rounded-full bg-white/85 blur-[0.3px]" />
        <span className="absolute right-4.5 top-4.5 h-1.5 w-3.5 rounded-full bg-white/70 blur-[0.3px]" />
      </span>

      {/* Sliding Sun / Moon Orb Thumb */}
      <span
        className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-all duration-500 ease-[cubic-bezier(0.34,1.45,0.64,1)] ${
          isDark
            ? 'translate-x-[32px] bg-gradient-to-br from-[#f8fafc] via-[#e2e8f0] to-[#cbd5e1] shadow-[0_0_12px_rgba(226,232,240,0.45)]'
            : 'translate-x-0 bg-gradient-to-br from-[#fde047] via-[#f59e0b] to-[#d97706] shadow-[0_0_12px_rgba(245,158,11,0.6)]'
        }`}
      >
        {/* Sun Icon */}
        <svg
          viewBox="0 0 24 24"
          className={`absolute h-4 w-4 text-amber-950/75 transition-all duration-500 ${
            isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.2" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>

        {/* Crescent Moon Icon */}
        <svg
          viewBox="0 0 24 24"
          className={`absolute h-4 w-4 text-slate-800 transition-all duration-500 ${
            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
          fill="currentColor"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
        </svg>
      </span>
    </button>
  );
}
