'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
import { animate, motion, useMotionValue } from 'framer-motion';
import { cn, MARKER_HEX } from '@/lib/utils';
import { useApp } from '@/store/app';
import { useToday } from '@/hooks/useToday';

const CELL_H = 52;
const WEEKDAYS = ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'];

function buildWeek(anchor: Date): Date[] {
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function getWeeks3(anchor: Date): [Date[], Date[], Date[]] {
  return [
    buildWeek(subWeeks(anchor, 1)),
    buildWeek(anchor),
    buildWeek(addWeeks(anchor, 1)),
  ];
}

export function Calendar({ onDayTap }: { onDayTap?: (date: string) => void } = {}) {
  const { selectedDate, setSelectedDate, workouts } = useApp();
  const selected = parseISO(selectedDate);
  const today = useToday();
  const [expanded, setExpanded] = useState(false);

  // All workouts markers — no user filter (store already holds current user's data)
  const markersByDate = useMemo(() => {
    const m = new Map<string, string[]>();
    workouts.forEach((w) => {
      const color = w.emojiBg ?? w.marker ?? 'blue';
      const arr = m.get(w.date) ?? [];
      if (!arr.includes(color)) arr.push(color);
      m.set(w.date, arr);
    });
    return m;
  }, [workouts]);

  // Full month grid (for expanded view)
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

  // ── 3-week carousel ────────────────────────────────────────────────────────
  const carouselRef = useRef<HTMLDivElement>(null);
  const [weeks3, setWeeks3] = useState<[Date[], Date[], Date[]]>(() =>
    getWeeks3(selected)
  );
  // x = offset of the 3-week strip; showing center week = x at -containerWidth
  const x = useMotionValue(-360); // will be corrected to actual width on mount
  const animating = useRef(false);
  const skipExternal = useRef(false);
  const pointerStartX = useRef<number | null>(null);

  // Set correct initial x after mount
  useLayoutEffect(() => {
    const W = carouselRef.current?.offsetWidth ?? 360;
    x.set(-W);
  }, []);

  // Sync carousel when selectedDate changes externally (scroll, month tap)
  useEffect(() => {
    if (skipExternal.current) return;
    const d = parseISO(selectedDate);
    setWeeks3(getWeeks3(d));
    const W = carouselRef.current?.offsetWidth ?? 360;
    x.set(-W);
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const navigateWeek = async (dir: 1 | -1) => {
    // dir = 1 → prev week (swipe right), dir = -1 → next week (swipe left)
    const W = carouselRef.current?.offsetWidth ?? 360;
    const targetX = dir === 1 ? 0 : -2 * W;
    animating.current = true;
    await animate(x, targetX, { type: 'spring', stiffness: 280, damping: 28, restDelta: 0.5 });
    const newDate = dir === 1 ? subWeeks(selected, 1) : addWeeks(selected, 1);
    skipExternal.current = true;
    setWeeks3(getWeeks3(newDate));
    x.set(-W);
    setSelectedDate(format(newDate, 'yyyy-MM-dd'));
    skipExternal.current = false;
    animating.current = false;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (animating.current || expanded) return;
    pointerStartX.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current === null || animating.current) return;
    const W = carouselRef.current?.offsetWidth ?? 360;
    const dx = e.clientX - pointerStartX.current;
    // Clamp so you don't drag past the adjacent weeks
    const clamped = Math.max(-2 * W, Math.min(0, -W + dx));
    x.set(clamped);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current === null || animating.current) return;
    const dx = e.clientX - pointerStartX.current;
    pointerStartX.current = null;
    const W = carouselRef.current?.offsetWidth ?? 360;
    if (dx > W * 0.28) {
      navigateWeek(1); // prev
    } else if (dx < -W * 0.28) {
      navigateWeek(-1); // next
    } else {
      // snap back to center
      animate(x, -W, { type: 'spring', stiffness: 400, damping: 35 });
    }
  };

  const handlePointerCancel = () => {
    pointerStartX.current = null;
    const W = carouselRef.current?.offsetWidth ?? 360;
    animate(x, -W, { type: 'spring', stiffness: 400, damping: 35 });
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
        animate={{ height: expanded ? 'auto' : CELL_H }}
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
                      onSelect={() => { setSelectedDate(dateKey); setExpanded(false); onDayTap?.(dateKey); }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          /* 3-week carousel */
          <div
            ref={carouselRef}
            className="overflow-hidden select-none"
            style={{ height: CELL_H }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          >
            <motion.div
              style={{ x, display: 'flex', width: '300%' }}
            >
              {weeks3.map((week, wi) => (
                <div
                  key={wi}
                  className="grid grid-cols-7"
                  style={{ width: '33.3334%' }}
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
                        onSelect={() => { setSelectedDate(dateKey); onDayTap?.(dateKey); }}
                      />
                    );
                  })}
                </div>
              ))}
            </motion.div>
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
      className="tappable relative flex flex-col items-center justify-center gap-0.5"
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
            ? 'text-ink-900'
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
