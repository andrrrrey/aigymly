'use client';

import { useMemo } from 'react';
import {
  addDays,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn, MARKER_HEX } from '@/lib/utils';
import { useApp } from '@/store/app';
import { useAuth } from '@/store/auth';

const WEEKDAYS = ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'];

export function Calendar() {
  const { selectedDate, setSelectedDate, workouts } = useApp();
  const user = useAuth((s) => s.user);
  const selected = parseISO(selectedDate);
  const today = useMemo(() => new Date(), []);

  const markersByDate = useMemo(() => {
    const m = new Map<string, string[]>();
    workouts
      .filter((w) => (user ? w.userEmail === user.email : !w.userEmail))
      .forEach((w) => {
        const arr = m.get(w.date) ?? [];
        if (!arr.includes(w.marker)) arr.push(w.marker);
        m.set(w.date, arr);
      });
    return m;
  }, [workouts, user]);

  // Week containing selected date
  const week = useMemo(() => {
    const start = startOfWeek(selected, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selected]);

  return (
    <div className="px-5 pt-2 pb-2">
      {/* Month label */}
      <div className="pb-2">
        <h2 className="font-display text-[28px] font-semibold tracking-tight text-ink-900">
          {format(selected, 'LLLL yyyy', { locale: ru }).replace(/^./, (c) => c.toUpperCase())}
        </h2>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 pb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center text-[11px] font-medium uppercase tracking-wider text-ink-400">
            {d}
          </div>
        ))}
      </div>

      {/* Single week row */}
      <div className="grid grid-cols-7">
        {week.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          return (
            <DayCell
              key={day.toISOString()}
              day={day}
              isSelected={isSameDay(day, selected)}
              isToday={isSameDay(day, today)}
              markers={markersByDate.get(dateKey) ?? []}
              onSelect={() => setSelectedDate(dateKey)}
            />
          );
        })}
      </div>
    </div>
  );
}

function DayCell({
  day,
  isSelected,
  isToday,
  markers,
  onSelect,
}: {
  day: Date;
  isSelected: boolean;
  isToday: boolean;
  markers: string[];
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="tappable relative grid h-12 place-items-center"
    >
      <div
        className={cn(
          'tabular flex h-9 w-9 items-center justify-center rounded-[10px] text-[17px] font-medium transition-colors',
          isSelected
            ? 'bg-brand text-white shadow-[0_2px_8px_rgba(47,107,255,0.35)]'
            : isToday
            ? 'text-brand font-semibold'
            : 'text-ink-900'
        )}
      >
        {day.getDate()}
      </div>
      {markers.length > 0 && (
        <div className="absolute bottom-1 flex gap-[2px]">
          {markers.slice(0, 3).map((m, i) => (
            <span
              key={i}
              className="block h-[3px] w-[3px] rounded-full"
              style={{
                backgroundColor: isSelected ? 'rgba(255,255,255,0.95)' : MARKER_HEX[m],
              }}
            />
          ))}
        </div>
      )}
    </button>
  );
}
