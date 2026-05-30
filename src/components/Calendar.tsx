'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addDays,
  addWeeks,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
  subWeeks,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn, MARKER_HEX } from '@/lib/utils';
import { useApp } from '@/store/app';
import { useAuth } from '@/store/auth';

const WEEK_HEIGHT = 52; // px per week row
const INITIAL_WEEKS_BEFORE = 26;
const INITIAL_WEEKS_AFTER = 26;
const LOAD_MORE = 8;

function getWeekStart(date: Date) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function buildWeek(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function Calendar() {
  const { selectedDate, setSelectedDate, workouts } = useApp();
  const user = useAuth((s) => s.user);
  const selected = parseISO(selectedDate);

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

  // Build initial list of week-start dates
  const today = useMemo(() => new Date(), []);
  const [weekStarts, setWeekStarts] = useState<Date[]>(() => {
    const anchor = getWeekStart(today);
    return Array.from({ length: INITIAL_WEEKS_BEFORE + 1 + INITIAL_WEEKS_AFTER }, (_, i) =>
      subWeeks(anchor, INITIAL_WEEKS_BEFORE - i)
    );
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleMonth, setVisibleMonth] = useState(today);
  const prepending = useRef(false);

  // Scroll to current week on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = INITIAL_WEEKS_BEFORE * WEEK_HEIGHT;
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || prepending.current) return;

    const firstVisibleIdx = Math.floor(el.scrollTop / WEEK_HEIGHT);
    const safeIdx = Math.max(0, Math.min(firstVisibleIdx, weekStarts.length - 1));
    setVisibleMonth(weekStarts[safeIdx]);

    // Load more at top
    if (el.scrollTop < WEEK_HEIGHT * 3) {
      prepending.current = true;
      const newWeeks = Array.from({ length: LOAD_MORE }, (_, i) =>
        subWeeks(weekStarts[0], LOAD_MORE - i)
      );
      const prevHeight = el.scrollHeight;
      setWeekStarts((prev) => [...newWeeks, ...prev]);
      // Restore scroll position after prepend (run after render)
      requestAnimationFrame(() => {
        el.scrollTop += el.scrollHeight - prevHeight;
        prepending.current = false;
      });
    }

    // Load more at bottom
    if (el.scrollTop + el.clientHeight > el.scrollHeight - WEEK_HEIGHT * 3) {
      const last = weekStarts[weekStarts.length - 1];
      const newWeeks = Array.from({ length: LOAD_MORE }, (_, i) =>
        addWeeks(last, i + 1)
      );
      setWeekStarts((prev) => [...prev, ...newWeeks]);
    }
  }, [weekStarts]);

  return (
    <div className="px-5 pt-2 pb-2">
      {/* Month header */}
      <div className="pb-2">
        <h2 className="font-display text-[28px] font-semibold tracking-tight text-ink-900">
          {format(visibleMonth, 'LLLL yyyy', { locale: ru }).replace(/^./, (c) => c.toUpperCase())}
        </h2>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 pb-1">
        {['П', 'В', 'С', 'Ч', 'П', 'С', 'В'].map((d, i) => (
          <div key={i} className="text-center text-[11px] font-medium uppercase tracking-wider text-ink-400">
            {d}
          </div>
        ))}
      </div>

      {/* Scrollable week list */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="no-scrollbar overflow-y-auto"
        style={{ height: WEEK_HEIGHT * 3 }}
      >
        {weekStarts.map((ws, wi) => (
          <div key={ws.toISOString()} className="grid grid-cols-7" style={{ height: WEEK_HEIGHT }}>
            {buildWeek(ws).map((day) => {
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
        ))}
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
  const dayNum = day.getDate();

  return (
    <button
      onClick={onSelect}
      className="tappable relative grid place-items-center"
      style={{ height: WEEK_HEIGHT }}
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
        {dayNum}
      </div>
      {markers.length > 0 && (
        <div className="absolute bottom-1.5 flex gap-[2px]">
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
