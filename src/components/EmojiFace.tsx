import type { WorkoutEmoji } from '@/types';

interface EmojiFaceProps {
  variant: WorkoutEmoji;
  size?: number;
}

export function EmojiFace({ variant, size = 56 }: EmojiFaceProps) {
  const s = size;
  switch (variant) {
    case 'wink':
      return (
        <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
          {/* Left eye open */}
          <circle cx="20" cy="24" r="2" fill="#161A21" />
          {/* Right eye wink */}
          <path d="M32 24c2 0 4-1 5-2" stroke="#161A21" strokeWidth="2.2" strokeLinecap="round" />
          {/* Smile */}
          <path d="M18 36c3 4 7 5 10 5s7-1 10-5" stroke="#161A21" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'sleepy':
      return (
        <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
          {/* Closed eyes */}
          <path d="M14 24c2 2 4 2 6 0" stroke="#161A21" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M36 24c2 2 4 2 6 0" stroke="#161A21" strokeWidth="2.2" strokeLinecap="round" />
          {/* Calm smile */}
          <path d="M20 36c3 3 6 4 8 4s5-1 8-4" stroke="#161A21" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'happy':
      return (
        <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
          <circle cx="20" cy="24" r="2.2" fill="#161A21" />
          <circle cx="36" cy="24" r="2.2" fill="#161A21" />
          <path d="M16 34c2 6 8 9 12 9s10-3 12-9" stroke="#161A21" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="#161A21" fillOpacity="0.05" />
        </svg>
      );
    case 'cool':
      return (
        <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
          {/* Sunglasses */}
          <rect x="12" y="20" width="13" height="8" rx="3" fill="#161A21" />
          <rect x="31" y="20" width="13" height="8" rx="3" fill="#161A21" />
          <path d="M25 24h6" stroke="#161A21" strokeWidth="2" />
          <path d="M18 36c3 3 6 4 10 4s7-1 10-4" stroke="#161A21" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'flex':
      return (
        <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
          <circle cx="20" cy="24" r="2.2" fill="#161A21" />
          <circle cx="36" cy="24" r="2.2" fill="#161A21" />
          <path d="M20 36h16" stroke="#161A21" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M14 18c2-1 4-1 6 0M36 18c2-1 4-1 6 0" stroke="#161A21" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'fire':
      return (
        <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
          <circle cx="20" cy="24" r="2.2" fill="#161A21" />
          <circle cx="36" cy="24" r="2.2" fill="#161A21" />
          <path d="M18 35c2 4 6 6 10 6s8-2 10-6" stroke="#161A21" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M14 16c1-2 3-2 4 0M38 16c1-2 3-2 4 0" stroke="#FF4D5E" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
  }
}
