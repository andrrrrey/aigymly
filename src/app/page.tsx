'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import { Calendar } from '@/components/Calendar';
import { WorkoutCard } from '@/components/WorkoutCard';
import { BottomNav } from '@/components/BottomNav';
import { useApp } from '@/store/app';
import { useAuth } from '@/store/auth';
import { AuthSheet } from '@/components/auth/AuthSheet';

export default function HomePage() {
  const router = useRouter();
  const { workouts, selectedDate, setSelectedDate } = useApp();
  const user = useAuth((s) => s.user);
  const [authOpen, setAuthOpen] = useState(false);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);
  // Prevent the IntersectionObserver from updating selectedDate while we're
  // programmatically scrolling to a date (triggered by calendar tap).
  const scrollingToDate = useRef(false);

  // All workouts grouped by date, sorted chronologically (past + future)
  const groupedWorkouts = useMemo(() => {
    const groups = new Map<string, typeof workouts>();
    [...workouts]
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      })
      .forEach((w) => {
        const arr = groups.get(w.date) ?? [];
        arr.push(w);
        groups.set(w.date, arr);
      });
    return Array.from(groups.entries());
  }, [workouts]);

  // IntersectionObserver: when a date section enters the viewport, update
  // selectedDate so the calendar week strip follows the scroll position.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollingToDate.current) return;
        // Pick the topmost visible section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const date = (visible[0].target as HTMLElement).dataset.date;
          if (date) setSelectedDate(date);
        }
      },
      { root: container, threshold: 0.3 }
    );

    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  // Re-run when the list of sections changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedWorkouts, setSelectedDate]);

  // When the user taps a day in the calendar, scroll the list to that date.
  useEffect(() => {
    const el = sectionRefs.current.get(selectedDate);
    if (!el) return;
    scrollingToDate.current = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Release the lock after the scroll animation finishes (~500 ms)
    const t = setTimeout(() => { scrollingToDate.current = false; }, 600);
    return () => clearTimeout(t);
  }, [selectedDate]);

  const handleCreate = () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    router.push(`/workout/new?date=${selectedDate}`);
  };

  return (
    <>
      <header
        className="shrink-0 bg-white"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <Calendar />
      </header>

      <main
        ref={scrollRef}
        className="no-scrollbar scroll-smooth-momentum relative flex-1 overflow-y-auto bg-white"
      >
        <div className="border-t border-ink-100" />
        <div className="space-y-5 px-5 pb-28 pt-5">
          {groupedWorkouts.length === 0 ? (
            <EmptyState onCreate={handleCreate} />
          ) : (
            groupedWorkouts.map(([date, list]) => (
              <section
                key={date}
                data-date={date}
                ref={(el) => {
                  if (el) sectionRefs.current.set(date, el);
                  else sectionRefs.current.delete(date);
                }}
                className="space-y-2"
              >
                <h3 className="text-[15px] font-semibold tracking-tight text-ink-900">
                  {format(parseISO(date), 'd MMMM, EEEE', { locale: ru }).replace(
                    /^./,
                    (c) => c.toUpperCase()
                  )}
                </h3>
                <div className="space-y-2">
                  {list.map((w) => (
                    <WorkoutCard key={w.id} workout={w} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        {/* Floating action button */}
        <button
          onClick={handleCreate}
          className="tappable fixed bottom-[80px] right-5 grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-fab"
          style={{ bottom: `calc(80px + env(safe-area-inset-bottom))` }}
          aria-label="Создать тренировку"
        >
          <Plus size={26} strokeWidth={2.4} />
        </button>
      </main>

      <BottomNav />
      <AuthSheet open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 pt-16 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-3xl bg-ink-100">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path
            d="M9 9h18v18H9zM9 15h18M14 6v6M22 6v6"
            stroke="#9099A8"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h3 className="mt-5 text-[17px] font-semibold text-ink-900">
        На этот день пусто
      </h3>
      <p className="mt-1 max-w-[260px] text-[14px] leading-snug text-ink-400">
        Создай тренировку или попроси AI собрать программу под твою цель
      </p>
      <button
        onClick={onCreate}
        className="tappable mt-5 rounded-full bg-brand px-5 py-2.5 text-[14px] font-semibold text-white shadow-fab"
      >
        Создать тренировку
      </button>
    </div>
  );
}
