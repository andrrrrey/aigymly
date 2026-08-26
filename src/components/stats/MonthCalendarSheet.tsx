'use client';

import { useMemo } from 'react';
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { DayCell, WEEKDAYS } from '@/components/calendar/DayCell';
import { useToday } from '@/hooks/useToday';
import { monthStartDate, type DateKey, type MonthKey } from '@/lib/statsMonth';
import { MonthSwitcher } from './MonthSwitcher';

// Full-screen month overview for the stats screen. Deliberately read-only and
// store-free: it never touches `selectedDate`, so browsing months here cannot
// retarget the home screen's agenda.
export function MonthCalendarSheet({
  open,
  onClose,
  monthKey,
  workoutCount,
  markersByDate,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: {
  open: boolean;
  onClose: () => void;
  monthKey: MonthKey;
  workoutCount: number;
  markersByDate: Map<DateKey, string[]>;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const today = useToday();
  const monthStart = monthStartDate(monthKey);

  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthStart), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
    const out: Date[][] = [];
    let cursor = start;
    while (cursor <= end) {
      out.push(Array.from({ length: 7 }, (_, i) => addDays(cursor, i)));
      cursor = addDays(cursor, 7);
    }
    return out;
  }, [monthKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label="Календарь тренировок"
          className="fixed inset-0 z-50 mx-auto flex max-w-[440px] flex-col bg-white"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex shrink-0 items-center justify-end px-5 pt-3">
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть календарь"
              className="tappable -mr-2 grid h-9 w-9 place-items-center rounded-full text-ink-500"
            >
              <X size={22} />
            </button>
          </div>

          <div className="shrink-0 px-5 pb-3">
            <MonthSwitcher
              monthKey={monthKey}
              canPrev={canPrev}
              canNext={canNext}
              onPrev={onPrev}
              onNext={onNext}
              size="lg"
            />
          </div>

          <div className="no-scrollbar flex-1 overflow-y-auto px-5">
            <div className="grid grid-cols-7 pb-1">
              {WEEKDAYS.map((d, i) => (
                <div
                  key={i}
                  className="text-center text-[11px] font-medium uppercase tracking-wider text-ink-400"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="space-y-0.5">
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7">
                  {week.map((day) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const markers = isCurrentMonth ? markersByDate.get(dateKey) ?? [] : [];
                    return (
                      <DayCell
                        key={dateKey}
                        day={day}
                        isSelected={false}
                        isToday={isSameDay(day, today)}
                        isCurrentMonth={isCurrentMonth}
                        markers={markers}
                        hasWorkout={markers.length > 0}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            <div
              className="pt-5 text-center text-[13px] text-ink-500"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}
            >
              {workoutCount === 0
                ? 'Тренировок в этом месяце не было'
                : `Тренировок в этом месяце: ${workoutCount}`}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
