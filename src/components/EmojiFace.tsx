import type { WorkoutEmoji } from '@/types';

interface EmojiFaceProps {
  variant: WorkoutEmoji;
  size?: number;
}

export function EmojiFace({ variant, size = 56 }: EmojiFaceProps) {
  const s = size;
  switch (variant) {
    case 'fire':
      return (
        <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
          <circle cx="20" cy="26" r="2.2" fill="#161A21" />
          <circle cx="36" cy="26" r="2.2" fill="#161A21" />
          <path d="M18 37c2 4 6 6 10 6s8-2 10-6" stroke="#161A21" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'happy':
      return (
        <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
          <circle cx="20" cy="24" r="2.5" fill="#161A21" />
          <circle cx="36" cy="24" r="2.5" fill="#161A21" />
          <path d="M16 34c2 6 8 9 12 9s10-3 12-9" stroke="#161A21" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'wink':
      return (
        <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
          <circle cx="20" cy="24" r="2" fill="#161A21" />
          <path d="M32 24c2 0 4-1 5-2" stroke="#161A21" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M18 36c3 4 7 5 10 5s7-1 10-5" stroke="#161A21" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'cool':
      return (
        <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
          <circle cx="20" cy="26" r="2.5" fill="#161A21" />
          <circle cx="36" cy="26" r="2.5" fill="#161A21" />
          <path d="M20 35h16" stroke="#161A21" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'sleepy':
      return (
        <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
          <path d="M15 23c1.5 1.5 3.5 2 5.5 1" stroke="#161A21" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M35 23c1.5 1.5 3.5 2 5.5 1" stroke="#161A21" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M20 37c3 2 6 2 8 2s5 0 8-2" stroke="#161A21" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'flex':
      return (
        <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
          <path d="M17 22l3 2-3 2" stroke="#161A21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M39 22l-3 2 3 2" stroke="#161A21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 38c2-2 4-3 8-3s6 1 8 3" stroke="#161A21" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'neutral':
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
          <path d="M17 22l4 3-4 3" stroke="#161A21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M39 22l-4 3 4 3" stroke="#161A21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 38c2 0 18 0 18 0" stroke="#161A21" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
  }
}
