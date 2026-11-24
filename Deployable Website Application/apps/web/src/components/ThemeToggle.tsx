import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../theme/ThemeContext';

/**
 * Small, quiet dark/light switch: one outline icon showing the theme you would switch to.
 */
export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light Mode' : 'Dark Mode'}
      onClick={toggleTheme}
      className="inline-flex h-8 w-7 shrink-0 sm:w-8 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:text-ink"
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
