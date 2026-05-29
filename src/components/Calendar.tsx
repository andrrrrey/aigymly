'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, MARKER_HEX } from '@/lib/utils';
import { useApp } from '@/store/app';
import { useAuth } from '@/store/auth';
import type { Workout } from '@/types';

const WEEKDAYS = ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'];
const WEEKDAYS_FULL = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface Props {
  expanded: boolean;
  onToggle: () => void;
}

export function Calendar({ expanded, onToggle }: Props) {
  const { selectedDate, setSelectedDate, workouts } = useApp();
  const user = useAuth((s) => s.user);
  const selected = parseISO(selectedDate);
  const [viewMonth, setViewMonth] = useState(selected);

  // Markers map: yyyy-MM-dd -> distinct colors (only for current user's workouts)
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

  // Compute weeks for current view month
  const monthWeeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
    const weeks: Date[][] = [];
    let cursor = start;
    while (cursor <= end) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(cursor);
        cursor = addDays(cursor, 1);
      }
      weeks.push(week);
    }
    return weeks;
  }, [viewMonth]);

  // For collapsed mode — show only the week containing selected date
  const selectedWeek = useMemo(() => {
    const start = startOfWeek(selected, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selected]);

  const goPrev = () => setViewMonth((m) => subMonths(m, 1));
  const goNext = () => setViewMonth((m) => addMonths(m, 1));

  return (
    <div className="px-5 pt-2">
      {/* Month header with navigation */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-1">
          <button
            onClick={goPrev}
            className="tappable -ml-1.5 grid h-8 w-8 place-items-center rounded-full text-ink-500 hover:bg-ink-100"
            aria-label="Предыдущий месяц"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-display text-[28px] font-semibold tracking-tight text-ink-900">
            {format(viewMonth, 'LLLL', { locale: ru }).replace(/^./, (c) => c.toUpperCase())}
          </h2>
          <button
            onClick={goNext}
            className="tappable grid h-8 w-8 place-items-center rounded-full text-ink-500 hover:bg-ink-100"
            aria-label="Следующий месяц"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <button
          onClick={onToggle}
          className="tappable grid h-9 w-9 place-items-center rounded-xl text-ink-700"
          aria-label={expanded ? 'Свернуть' : 'Развернуть'}
        >
          <CalendarIcon expanded={expanded} />
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 pb-1.5">
        {WEEKDAYS_FULL.map((d, i) => (
          <div
            key={i}
            className="text-center text-[11px] font-medium uppercase tracking-wider text-ink-400"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid with height animation */}
      <motion.div
        animate={{ height: expanded ? 'auto' : 56 }}
        initial={false}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        {expanded ? (
          <div className="space-y-0.5">
            {monthWeeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((day) => (
                  <DayCell
                    key={day.toISOString()}
                    day={day}
                    isSelected={isSameDay(day, selected)}
                    isCurrentMonth={isSameMonth(day, viewMonth)}
                    markers={markersByDate.get(format(day, 'yyyy-MM-dd')) ?? []}
                    onSelect={() => setSelectedDate(format(day, 'yyyy-MM-dd'))}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {selectedWeek.map((day) => (
              <DayCell
                key={day.toISOString()}
                day={day}
                isSelected={isSameDay(day, selected)}
                isCurrentMonth={true}
                markers={markersByDate.get(format(day, 'yyyy-MM-dd')) ?? []}
                onSelect={() => setSelectedDate(format(day, 'yyyy-MM-dd'))}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function DayCell({
  day,
  isSelected,
  isCurrentMonth,
  markers,
  onSelect,
}: {
  day: Date;
  isSelected: boolean;
  isCurrentMonth: boolean;
  markers: string[];
  onSelect: () => void;
}) {
  const dayNum = day.getDate();

  return (
    <button
      onClick={onSelect}
      className="tappable group relative grid h-12 place-items-center"
    >
      <div
        className={cn(
          'tabular flex h-9 w-9 items-center justify-center rounded-[10px] text-[17px] font-medium transition-colors',
          isSelected
            ? 'bg-brand text-white shadow-[0_2px_8px_rgba(47,107,255,0.35)]'
            : isCurrentMonth
            ? 'text-ink-900'
            : 'text-ink-300'
        )}
      >
        {dayNum}
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

function CalendarIcon({ expanded }: { expanded: boolean }) {
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
