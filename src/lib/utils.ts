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

// App weekday convention: 0=Mon ... 6=Sun (JS getDay is 0=Sun ... 6=Sat).
export function appWeekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Returns the first ISO date >= startISO whose app-weekday equals `weekday`.
export function nextDateForWeekday(startISO: string, weekday: number): string {
  const start = new Date(startISO + 'T00:00:00');
  const diff = (weekday - appWeekday(start) + 7) % 7;
  return addDaysISO(startISO, diff);
}

// Adds minutes to a "HH:mm" string, clamped to the same day (max 23:59).
export function addMinutesToTime(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const total = Math.min(h * 60 + m + minutes, 23 * 60 + 59);
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
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
