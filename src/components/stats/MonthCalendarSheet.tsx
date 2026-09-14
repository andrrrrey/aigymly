'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
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
import { ArrowRight, Brain, ChevronRight, Lock, X } from 'lucide-react';
import { DayCell, WEEKDAYS } from '@/components/calendar/DayCell';
import { useToday } from '@/hooks/useToday';
import {
  formatMonthTitle,
  monthStartDate,
  type DateKey,
  type MonthKey,
  type MonthReportInput,
} from '@/lib/statsMonth';
import { MonthSwitcher } from './MonthSwitcher';
import { MonthlyReportSheet } from './MonthlyReportSheet';

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
  isPro,
  reportMonths,
  buildReportPayload,
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
  isPro: boolean;
  // All past months with an available AI report, newest first. Independent of
  // the browsed month — this is a progress archive, not a per-month view.
  reportMonths: MonthKey[];
  buildReportPayload: (monthKey: MonthKey) => MonthReportInput;
}) {
  const today = useToday();
  const monthStart = monthStartDate(monthKey);
  const [reportMonth, setReportMonth] = useState<MonthKey | null>(null);

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

            <div className="pb-5 pt-5 text-center text-[13px] text-ink-500">
              {workoutCount === 0
                ? 'Тренировок в этом месяце не было'
                : `Тренировок в этом месяце: ${workoutCount}`}
            </div>

            {/* AI-итоги: архив прогресса. Список не зависит от пролистывания
                календаря — он всегда показывает все доступные отчёты. */}
            <div
              className="border-t border-dashed border-ink-200 pt-5"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
            >
              <h3 className="mb-3 flex items-center gap-1.5 text-[15px] font-semibold tracking-tight text-ink-900">
                <Brain size={16} className="text-brand" />
                AI-итоги
              </h3>

              {!isPro ? (
                <Link
                  href="/subscribe"
                  className="tappable flex items-center gap-3 rounded-2xl border border-ink-100 bg-ink-50 p-4"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                    <Lock size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold text-ink-900">
                      AI-итоги месяца — по подписке
                    </span>
                    <span className="block text-[12px] leading-snug text-ink-500">
                      Ежемесячный разбор прогресса в Ai Gymly Pro
                    </span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-ink-300" />
                </Link>
              ) : reportMonths.length === 0 ? (
                <p className="rounded-2xl bg-ink-50 p-4 text-[13px] leading-snug text-ink-500">
                  Итоги появятся, когда наберётся месяц с тремя и более тренировками.
                  Отмечайте подходы галочкой — и AI подведёт итоги месяца.
                </p>
              ) : (
                <div className="space-y-2">
                  {reportMonths.map((mk) => (
                    <button
                      key={mk}
                      type="button"
                      onClick={() => setReportMonth(mk)}
                      className="tappable flex w-full items-center gap-3 rounded-2xl border border-ink-100 bg-ink-50 px-4 py-3.5 text-left"
                    >
                      <span className="min-w-0 flex-1 text-[14px] font-medium text-ink-900">
                        AI итоги • {formatMonthTitle(mk)}
                      </span>
                      <ArrowRight size={18} className="shrink-0 text-ink-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <MonthlyReportSheet
            open={reportMonth !== null}
            monthKey={reportMonth}
            onClose={() => setReportMonth(null)}
            buildPayload={buildReportPayload}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
