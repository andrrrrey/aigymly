'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO, startOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Plus, X } from 'lucide-react';
import { Calendar } from '@/components/Calendar';
import { WorkoutCard } from '@/components/WorkoutCard';
import { BottomNav } from '@/components/BottomNav';
import { useApp } from '@/store/app';
import { useAuth } from '@/store/auth';
import { AuthSheet } from '@/components/auth/AuthSheet';
import { useToday } from '@/hooks/useToday';

export default function HomePage() {
  const router = useRouter();
  const { workouts, selectedDate, setSelectedDate } = useApp();
  const user = useAuth((s) => s.user);
  const [authOpen, setAuthOpen] = useState(false);
  // When set, the list is filtered to a single tapped date; otherwise it shows
  // the upcoming agenda (today and future).
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollingToDate = useRef(false);
  const didInitialScroll = useRef(false);

  const today = useToday();
  const todayStr = format(today, 'yyyy-MM-dd');

  // On mount: reset selectedDate to today if it's from a past week
  useEffect(() => {
    const thisWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    if (selectedDate < thisWeekStart) {
      setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // What the list renders: a single tapped date, or the full agenda (past +
  // future) so the user can scroll up into history and down into the future.
  const displayedGroups = useMemo(() => {
    if (filterDate) return groupedWorkouts.filter(([d]) => d === filterDate);
    return groupedWorkouts;
  }, [groupedWorkouts, filterDate]);

  // IntersectionObserver: when a date section enters the viewport, update
  // selectedDate so the calendar week strip follows the scroll position
  // (agenda mode only — filtered mode shows a single section).
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || filterDate) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollingToDate.current) return;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedGroups, filterDate, setSelectedDate]);

  // Initial scroll: anchor the full agenda at today or the nearest future date,
  // leaving past dates reachable by scrolling up. Runs once the list loads.
  useEffect(() => {
    if (didInitialScroll.current || filterDate || groupedWorkouts.length === 0) return;
    didInitialScroll.current = true;
    const dates = groupedWorkouts.map(([d]) => d).sort();
    const target = dates.find((d) => d >= todayStr) ?? dates[dates.length - 1];
    const el = target ? sectionRefs.current.get(target) : null;
    if (el) {
      scrollingToDate.current = true;
      el.scrollIntoView({ behavior: 'instant', block: 'start' });
      setTimeout(() => { scrollingToDate.current = false; }, 300);
    }
  }, [groupedWorkouts, filterDate, todayStr]);

  // Tapping a calendar day toggles the single-date filter for the list.
  const handleDayTap = (date: string) => {
    setFilterDate((cur) => (cur === date ? null : date));
  };

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
        <Calendar onDayTap={handleDayTap} />
      </header>

      <main
        ref={scrollRef}
        className="no-scrollbar scroll-smooth-momentum relative flex-1 overflow-y-auto bg-white"
      >
        <div className="border-t border-ink-100" />
        {filterDate && (
          <div className="flex items-center justify-between gap-3 px-5 pt-4">
            <span className="text-[13px] font-medium text-ink-500">
              {format(parseISO(filterDate), 'd MMMM, EEEE', { locale: ru }).replace(
                /^./,
                (c) => c.toUpperCase()
              )}
            </span>
            <button
              onClick={() => setFilterDate(null)}
              className="tappable flex items-center gap-1 rounded-full bg-ink-100 py-1.5 pl-3 pr-2.5 text-[13px] font-semibold text-ink-700"
            >
              Показать все дни
              <X size={14} />
            </button>
          </div>
        )}
        <div className="space-y-5 px-5 pb-28 pt-5">
          {displayedGroups.length === 0 ? (
            <EmptyState
              onCreate={handleCreate}
              title={filterDate ? 'На этот день пусто' : 'Тренировок пока нет'}
            />
          ) : (
            displayedGroups.map(([date, list]) => (
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

function EmptyState({ onCreate, title }: { onCreate: () => void; title: string }) {
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
        {title}
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
