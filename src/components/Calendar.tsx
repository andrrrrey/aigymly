'use client';

import { useMemo, useRef, useState } from 'react';
import {
  addDays,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subWeeks,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn, MARKER_HEX } from '@/lib/utils';
import { useApp } from '@/store/app';
import { useAuth } from '@/store/auth';

const WEEKDAYS = ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'];

export function Calendar() {
  const { selectedDate, setSelectedDate, workouts } = useApp();
  const user = useAuth((s) => s.user);
  const selected = parseISO(selectedDate);
  const today = useMemo(() => new Date(), []);
  const [expanded, setExpanded] = useState(false);

  const markersByDate = useMemo(() => {
    const m = new Map<string, string[]>();
    workouts
      .filter((w) => (user ? w.userEmail === user.email : !w.userEmail))
      .forEach((w) => {
        const arr = m.get(w.date) ?? [];
        if (!arr.includes(w.emojiBg)) arr.push(w.emojiBg);
        m.set(w.date, arr);
      });
    return m;
  }, [workouts, user]);

  // Week containing selected date
  const week = useMemo(() => {
    const start = startOfWeek(selected, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selected]);

  // Full month grid
  const monthWeeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(selected), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(selected), { weekStartsOn: 1 });
    const weeks: Date[][] = [];
    let cursor = start;
    while (cursor <= end) {
      weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cursor, i)));
      cursor = addDays(cursor, 7);
    }
    return weeks;
  }, [selected]);

  // Swipe handling
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 40) return;
    const next = dx < 0 ? addWeeks(selected, 1) : subWeeks(selected, 1);
    setSelectedDate(format(next, 'yyyy-MM-dd'));
  };

  return (
    <div className="px-5 pt-2 pb-2">
      {/* Month label + expand toggle */}
      <div className="flex items-center justify-between pb-2">
        <h2 className="font-display text-[28px] font-semibold tracking-tight text-ink-900">
          {format(selected, 'LLLL yyyy', { locale: ru }).replace(/^./, (c) => c.toUpperCase())}
        </h2>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="tappable grid h-9 w-9 place-items-center rounded-xl text-ink-500"
          aria-label={expanded ? 'Свернуть' : 'Показать месяц'}
        >
          <CalendarToggleIcon expanded={expanded} />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 pb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center text-[11px] font-medium uppercase tracking-wider text-ink-400">
            {d}
          </div>
        ))}
      </div>

      {/* Week row (collapsed) or full month (expanded) */}
      <motion.div
        animate={{ height: expanded ? 'auto' : 48 }}
        initial={false}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        {expanded ? (
          <div className="space-y-0.5">
            {monthWeeks.map((w, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {w.map((day) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  return (
                    <DayCell
                      key={day.toISOString()}
                      day={day}
                      isSelected={isSameDay(day, selected)}
                      isToday={isSameDay(day, today)}
                      isCurrentMonth={isSameMonth(day, selected)}
                      markers={markersByDate.get(dateKey) ?? []}
                      onSelect={() => { setSelectedDate(dateKey); setExpanded(false); }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div
            className="grid grid-cols-7"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {week.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              return (
                <DayCell
                  key={day.toISOString()}
                  day={day}
                  isSelected={isSameDay(day, selected)}
                  isToday={isSameDay(day, today)}
                  isCurrentMonth
                  markers={markersByDate.get(dateKey) ?? []}
                  onSelect={() => setSelectedDate(dateKey)}
                />
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function DayCell({
  day,
  isSelected,
  isToday,
  isCurrentMonth,
  markers,
  onSelect,
}: {
  day: Date;
  isSelected: boolean;
  isToday: boolean;
  isCurrentMonth: boolean;
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
            : isCurrentMonth
            ? 'text-ink-900'
            : 'text-ink-300'
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

function CalendarToggleIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="4.5" width="16" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 9h16" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 3v3M15 3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <motion.path
        d="M7 13l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{ pathLength: expanded ? 1 : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.25 }}
      />
    </svg>
  );
}
