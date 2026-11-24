interface FortIllustrationProps {
  className?: string;
}

const FROND_PATHS = [
  'M0 0C-22-20-52-17-67 8-45-4-21-5 0 0Z',
  'M0 0C-15-30-40-45-61-40-40-33-19-18 0 0Z',
  'M0 0C-7-28 1-51 16-61 12-40 8-20 0 0Z',
  'M0 0C16-31 40-43 61-36 40-30 19-16 0 0Z',
  'M0 0C22-21 52-14 65 12 44-3 21-5 0 0Z',
  'M0 0C-18-2-38 10-45 31-30 16-14 8 0 0Z',
  'M0 0C18-2 37 12 41 33 28 16 14 8 0 0Z',
];

function Palm({ x, y, scale = 1, flip = false }: { x: number; y: number; scale?: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      {/* Trunk */}
      <path
        d="M-5 2C-9 42-12 80-13 124H3C1 80 2 42 5 2Z"
        fill="var(--color-surface)"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M-8 30 3 27M-9 52 2 49M-10 74 2 71M-11 96 2 93"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Fronds */}
      {FROND_PATHS.map((d) => (
        <path
          key={d}
          d={d}
          fill="var(--color-brand)"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      ))}
      <circle cx="-3" cy="6" r="2.6" fill="currentColor" />
      <circle cx="4" cy="7" r="2.6" fill="currentColor" />
    </g>
  );
}

/**
 * Hero line drawing: a round fort tower on a small hill, a UAE flag on its pole,
 * two palms and a cloud. Ink lines use the current text colour, so only the stroke
 * changes between the light and dark themes. Never mirrored (the flag's hoist stays left).
 */
export function FortIllustration({ className = '' }: FortIllustrationProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 480 360"
      fill="none"
      className={`text-outline ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      {/* Cloud */}
      <path
        d="M356 112c-15 0-19-17-5-21 0-17 23-23 32-9 13-10 34-2 30 13 14 3 13 17-1 17Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M52 96c-10 0-12-12-3-14 1-12 17-15 23-5 9-6 23 0 20 10 9 2 8 9-1 9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Palms stand behind the hill line */}
      <Palm x={100} y={200} />
      <Palm x={390} y={226} scale={0.8} flip />

      {/* Hill */}
      <path d="M12 342C70 318 130 300 200 296c80-5 170 8 268 46Z" fill="var(--color-page)" />
      <path
        d="M12 342C70 318 130 300 200 296c80-5 170 8 268 46"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M146 304l2-9M152 303l1-10M158 302l-1-8M332 305l1-9M338 306l2-9M418 326l1-8M424 328l2-8M60 327l1-8M66 325l2-8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Flag pole */}
      <path d="M240 132V44" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="240" cy="41" r="3.4" fill="currentColor" />
      {/* UAE flag: red vertical band at the hoist, then green, white, black */}
      <rect x="241.5" y="50" width="14" height="30" fill="#C8102E" />
      <rect x="255.500" y="50" width="42.500" height="10" fill="#00843D" />
      <rect x="255.500" y="60" width="42.500" height="10" fill="#FFFFFF" />
      <rect x="255.500" y="70" width="42.500" height="10" fill="#111111" />
      <path d="M241.500 50H298V80H241.500" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />

      {/* Round tower body */}
      <path
        d="M190 150 180 298c38 13 82 13 120-1L291 150Z"
        fill="var(--color-surface)"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* Crenellated parapet */}
      <path
        d="M178 153V119l19-1v12l16 1v-13l19 1v12h16v-13l19 1v12l16-1v-12l19 1v34c-39 11-85 11-124 0Z"
        fill="var(--color-surface)"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M187 208c34 10 72 10 107-1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Slit windows */}
      <path
        d="M211 190v-12c0-7 10-7 10 0v12ZM259 192v-12c0-7 10-7 10 0v12Z"
        fill="var(--color-brand-tint)"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Arched gate */}
      <path
        d="M223 306v-38c0-23 34-23 34 0v38"
        fill="var(--color-brand-tint)"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path d="M240 252v55" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* A few brick marks */}
      <path
        d="M196 232h14M270 238h16M200 262h10M274 270h14M232 224h13M266 172h12M198 172h9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
