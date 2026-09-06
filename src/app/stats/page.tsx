'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { BottomNav } from '@/components/BottomNav';
import { useApp } from '@/store/app';
import { useAuth } from '@/store/auth';
import { useToday } from '@/hooks/useToday';
import { computeExerciseStats } from '@/lib/exerciseStats';
import {
  computeMonthStats,
  computeTrainingMarkers,
  currentMonthKey,
  findLastTrainingWorkout,
  listMonthKeysWithData,
  shiftMonthKey,
} from '@/lib/statsMonth';
import { pluralRu } from '@/lib/utils';
import { MonthSwitcher } from '@/components/stats/MonthSwitcher';
import { MonthCalendarSheet } from '@/components/stats/MonthCalendarSheet';
import { DisciplineBlock } from '@/components/stats/DisciplineBlock';
import { TonnageBlock } from '@/components/stats/TonnageBlock';
import { StrengthBlock } from '@/components/stats/StrengthBlock';
import { MuscleBalanceBlock } from '@/components/stats/MuscleBalanceBlock';
import { LastWorkoutBlock } from '@/components/stats/LastWorkoutBlock';
import { AiSummaryBlock } from '@/components/stats/AiSummaryBlock';

export default function StatsPage() {
  const { workouts } = useApp();
  const isPro = useAuth((s) => !!s.user?.isPro);
  const today = useToday();
  const thisMonth = currentMonthKey(today);

  const [monthKey, setMonthKey] = useState(thisMonth);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const stats = useMemo(
    () => computeMonthStats(workouts, monthKey),
    [workouts, monthKey]
  );
  const markersByDate = useMemo(() => computeTrainingMarkers(workouts), [workouts]);
  const monthsWithData = useMemo(() => listMonthKeysWithData(workouts), [workouts]);
  const lastWorkout = useMemo(
    () => findLastTrainingWorkout(workouts, monthKey),
    [workouts, monthKey]
  );
  const exerciseStats = useMemo(() => computeExerciseStats(workouts), [workouts]);

  // Never arrow past the first month that holds data, or into the future —
  // planned workouts are deliberately excluded, so future months are always empty.
  const earliestMonth = monthsWithData[0] ?? thisMonth;
  const canPrev = monthKey > earliestMonth;
  const canNext = monthKey < thisMonth;

  const goPrev = () => canPrev && setMonthKey((m) => shiftMonthKey(m, -1));
  const goNext = () => canNext && setMonthKey((m) => shiftMonthKey(m, 1));

  return (
    <>
      <header
        className="shrink-0 bg-white"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="px-5 pb-3 pt-3">
          <h1 className="font-display text-[28px] font-semibold tracking-tight text-ink-900">
            Статистика
          </h1>
        </div>
      </header>

      <main className="no-scrollbar scroll-smooth-momentum flex-1 overflow-y-auto bg-white px-5 pb-24">
        {/* The month applies to the whole feed, so it has to stay reachable
            while scrolling through four blocks. */}
        <div className="sticky top-0 z-10 -mx-5 border-b border-ink-100 bg-white/95 px-5 py-2 backdrop-blur-sm">
          <MonthSwitcher
            monthKey={monthKey}
            canPrev={canPrev}
            canNext={canNext}
            onPrev={goPrev}
            onNext={goNext}
            onOpenCalendar={() => setCalendarOpen(true)}
          />
        </div>

        <div className="pt-4">
          <DisciplineBlock stats={stats} />
        </div>

        <TonnageBlock stats={stats} />
        <AiSummaryBlock stats={stats} isPro={isPro} />
        <StrengthBlock stats={stats} />
        <MuscleBalanceBlock stats={stats} />
        <LastWorkoutBlock workout={lastWorkout} />

        <section className="mt-7">
          <h2 className="mb-2 text-[17px] font-semibold tracking-tight text-ink-900">
            Упражнения
          </h2>
          {exerciseStats.length === 0 ? (
            <p className="rounded-2xl bg-ink-50 p-4 text-[13px] leading-snug text-ink-500">
              Отмечайте подходы галочкой во время тренировки — выполненные
              упражнения появятся здесь, и вы сможете смотреть их историю.
            </p>
          ) : (
            <div className="divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-100">
              {exerciseStats.map((ex) => (
                <Link
                  key={ex.name}
                  href={`/exercise/${encodeURIComponent(ex.name)}`}
                  className="tappable flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-ink-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-medium tracking-tight text-ink-900">
                      {ex.name}
                    </div>
                    <div className="mt-0.5 text-[12px] text-ink-400">
                      {ex.totalDoneSets}{' '}
                      {pluralRu(ex.totalDoneSets, ['подход', 'подхода', 'подходов'])}
                      {ex.lastDate
                        ? ` · ${format(parseISO(ex.lastDate), 'd MMM yyyy', { locale: ru })}`
                        : ''}
                    </div>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-ink-300" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />

      <MonthCalendarSheet
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        monthKey={monthKey}
        workoutCount={stats.workoutCount}
        markersByDate={markersByDate}
        canPrev={canPrev}
        canNext={canNext}
        onPrev={goPrev}
        onNext={goNext}
      />
    </>
  );
}
