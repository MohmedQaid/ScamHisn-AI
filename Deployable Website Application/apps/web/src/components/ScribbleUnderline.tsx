import type { ReactNode } from 'react';

interface ScribbleUnderlineProps {
  className?: string;
}

/**
 * Hand-drawn emerald underline. Stretches to the width of its positioned parent;
 * the stroke keeps its weight however wide it is drawn.
 */
export function ScribbleUnderline({ className = '' }: ScribbleUnderlineProps) {
  return (
    <svg
      viewBox="0 0 200 16"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={`pointer-events-none absolute start-0 text-brand rtl:-scale-x-100 ${className}`}
    >
      <path
        d="M3 9.5C27 4.5 49 3.2 74 6.4c23 3 41 5.6 66 2.6 21-2.5 38-5.6 57-3.4"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M22 13.2c30-3.4 58-2.2 86-1.2 25 .9 47-.4 72-3.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        opacity="0.75"
      />
    </svg>
  );
}

/** A word (or short phrase) with the scribble drawn under its full width: used in the hero. */
export function Scribbled({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      <span className="relative z-10">{children}</span>
      <ScribbleUnderline className="-bottom-[0.14em] h-[0.2em] w-full" />
    </span>
  );
}

/** Section heading with a short scribble under its start: "Evidence", "Checked link", Impact sections. */
export function SectionHeading({
  children,
  as: Tag = 'h2',
  className = '',
}: {
  children: ReactNode;
  as?: 'h2' | 'h3';
  className?: string;
}) {
  return (
    <Tag className={`relative inline-block pb-2.5 text-xl font-extrabold text-ink sm:text-2xl ${className}`}>
      {children}
      <ScribbleUnderline className="bottom-0 h-2.5 w-full max-w-[7rem]" />
    </Tag>
  );
}
