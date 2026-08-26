'use client';

import { cn, MARKER_HEX } from '@/lib/utils';

export const CELL_H = 52;
export const WEEKDAYS = ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'];

// One day of a month grid. Shared by the home calendar and the stats calendar
// so the "today" and other-month treatments can never drift apart.
export function DayCell({
  day,
  isSelected,
  isToday,
  isCurrentMonth,
  markers,
  onSelect,
  hasWorkout = false,
}: {
  day: Date;
  isSelected: boolean;
  isToday: boolean;
  isCurrentMonth: boolean;
  markers: string[];
  onSelect?: () => void;
  /** Fills the day with a light tint — used by the stats calendar. */
  hasWorkout?: boolean;
}) {
  const Tag = onSelect ? 'button' : 'div';
  return (
    <Tag
      onClick={onSelect}
      className={cn(
        'relative flex flex-col items-center justify-center gap-0.5',
        onSelect && 'tappable'
      )}
      style={{ height: CELL_H }}
    >
      <div
        className={cn(
          'tabular flex h-9 w-9 items-center justify-center rounded-[10px] text-[17px] font-medium transition-colors',
          isToday
            ? 'bg-brand text-white shadow-[0_2px_8px_rgba(47,107,255,0.35)]'
            : isSelected
            ? 'bg-brand/15 text-ink-900'
            : isCurrentMonth
            ? cn('text-ink-900', hasWorkout && 'bg-ink-100')
            : 'text-ink-300'
        )}
      >
        {day.getDate()}
      </div>
      <div className="flex h-[5px] items-center gap-[3px]">
        {markers.slice(0, 3).map((m, i) => (
          <span
            key={i}
            className="block h-[4px] w-[4px] rounded-full"
            style={{
              backgroundColor: isToday ? 'rgba(255,255,255,0.85)' : MARKER_HEX[m] ?? '#9099A8',
            }}
          />
        ))}
      </div>
    </Tag>
  );
}
