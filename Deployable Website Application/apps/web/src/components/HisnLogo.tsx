interface HisnLogoProps {
  className?: string;
}

/**
 * ScamHisn AI (حصن الاحتيال) mark: a small sketched green fort tower flying a tiny UAE flag.
 * Ink lines follow the current text colour so the mark works on light and dark paper.
 */
export function HisnLogo({ className = 'h-10 w-10' }: HisnLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      fill="none"
      className={`text-outline ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      {/* Tower with three merlons */}
      <path
        d="M9.2 36.4 10 19.6H7.4l.2-6.2 5-.2.1 2.9 3.6.1.1-3 6.3-.1.1 3 3.7-.1v-2.9l5 .1.3 6.3-2.6.1.9 16.8Z"
        fill="var(--color-brand)"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      {/* Arched gate */}
      <path
        d="M16.6 36.3v-6.2c0-2.2 1.5-3.7 3.5-3.7s3.4 1.5 3.4 3.7v6.2"
        fill="var(--color-page)"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M13.4 22.6h3M23.8 23.4h2.8" stroke="var(--color-page)" strokeWidth="1.3" strokeLinecap="round" />
      {/* Flag pole and UAE flag: red band at the hoist, then green, white, black */}
      <path d="M19.6 13.2V2.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="20.3" y="2.6" width="3.2" height="7.2" fill="#C8102E" />
      <rect x="23.5" y="2.6" width="8.3" height="2.4" fill="#00843D" />
      <rect x="23.5" y="5" width="8.3" height="2.4" fill="#FFFFFF" />
      <rect x="23.5" y="7.4" width="8.3" height="2.4" fill="#111111" />
      <rect
        x="20.3"
        y="2.6"
        width="11.5"
        height="7.2"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
