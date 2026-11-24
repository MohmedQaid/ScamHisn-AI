import { useId } from 'react';

interface HisnLogoProps {
  className?: string;
}

/**
 * Official minimal ScamHisn AI (حصن الاحتيال) logo:
 * Minimal Emirati Hisn (fortress) icon in UAE flag colors with green as the dominant main color.
 */
export function HisnLogo({ className = 'h-10 w-10' }: HisnLogoProps) {
  const uid = useId().replace(/:/g, '');
  const gradId = `hisnGreen-${uid}`;
  const clipId = `badgeClip-${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="12" y1="6" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#006A38" />
        </linearGradient>
        <clipPath id={clipId}>
          <rect x="4" y="4" width="56" height="56" rx="15" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {/* Dominant UAE Emerald Green field */}
        <rect x="4" y="4" width="56" height="56" fill={`url(#${gradId})`} />
        {/* Minimal UAE Red vertical accent band */}
        <rect x="4" y="4" width="10" height="56" fill="#CE1126" />
        {/* Crisp White minimal Hisn fortress silhouette with 3 battlements */}
        <path
          d="M21 20H26V25H31.5V20H37.5V25H43V20H48V46C48 47.6569 46.6569 49 45 49H24C22.3431 49 21 47.6569 21 46V20Z"
          fill="#FFFFFF"
        />
        {/* Minimal Obsidian Black arched fortress gate */}
        <path
          d="M30 49V39.5C30 37.0147 32.0147 35 34.5 35C36.9853 35 39 37.0147 39 39.5V49H30Z"
          fill="#0B1215"
        />
      </g>
    </svg>
  );
}
