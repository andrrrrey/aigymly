import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export const MARKER_HEX: Record<string, string> = {
  red: '#FF4D5E',
  orange: '#FF9028',
  yellow: '#FFC23C',
  green: '#22C58B',
  cyan: '#22B8D9',
  blue: '#2F6BFF',
  purple: '#8B5CF6',
  gray: '#9099A8',
};

export const EMOJI_BG: Record<string, string> = {
  red: 'bg-[#FFD9DC]',
  orange: 'bg-[#FFE2C9]',
  yellow: 'bg-[#FFE7A3]',
  green: 'bg-[#C9F0DE]',
  cyan: 'bg-[#C5EBF3]',
  blue: 'bg-[#D6E2FF]',
  purple: 'bg-[#E5DBFB]',
  gray: 'bg-[#EFF1F5]',
};
