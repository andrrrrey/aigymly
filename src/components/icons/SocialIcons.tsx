// Simple brand glyphs for social links. Lucide dropped brand icons, so these
// are minimal inline SVGs sized to sit next to lucide icons. `currentColor`
// lets them inherit text color from the wrapping element.
interface IconProps {
  size?: number;
  className?: string;
}

export function TelegramIcon({ size = 20, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M21.94 4.3a1.2 1.2 0 0 0-1.24-.2L3.36 11.03c-.9.36-.87 1.65.05 1.96l4.3 1.42 1.63 5.07a.86.86 0 0 0 1.42.35l2.35-2.23 4.36 3.2a1.2 1.2 0 0 0 1.88-.72l2.98-14.2a1.2 1.2 0 0 0-.39-1.18ZM9.8 14.2l8.13-5.02c.16-.1.33.11.19.24l-6.7 6.16a.87.87 0 0 0-.27.53l-.22 2.03a.15.15 0 0 1-.29.03l-1.06-3.28a.86.86 0 0 1 .22-.72Z" />
    </svg>
  );
}

export function PinterestIcon({ size = 20, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.64 7.86 6.36 9.32-.09-.79-.17-2 .03-2.86.18-.78 1.17-4.97 1.17-4.97s-.3-.6-.3-1.48c0-1.39.8-2.42 1.8-2.42.85 0 1.26.64 1.26 1.4 0 .86-.55 2.14-.83 3.33-.24 1 .5 1.81 1.48 1.81 1.78 0 3.14-1.87 3.14-4.58 0-2.39-1.72-4.07-4.18-4.07-2.85 0-4.52 2.13-4.52 4.34 0 .86.33 1.78.74 2.28.08.1.09.19.07.29-.08.31-.24.98-.28 1.12-.04.18-.15.22-.34.13-1.25-.58-2.03-2.4-2.03-3.87 0-3.15 2.29-6.04 6.6-6.04 3.46 0 6.16 2.47 6.16 5.77 0 3.44-2.17 6.21-5.18 6.21-1.01 0-1.96-.53-2.29-1.15l-.62 2.37c-.22.86-.83 1.94-1.24 2.6.94.29 1.92.44 2.95.44 5.52 0 10-4.48 10-10S17.52 2 12 2Z" />
    </svg>
  );
}
