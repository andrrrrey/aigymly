'use client';

import Link from 'next/link';
import { Copy } from 'lucide-react';
import { EmojiFace } from './EmojiFace';
import { cn, EMOJI_BG, MARKER_HEX } from '@/lib/utils';
import type { Workout } from '@/types';
import { useApp } from '@/store/app';
import { uid } from '@/lib/utils';

export function WorkoutCard({ workout }: { workout: Workout }) {
  const { addWorkout } = useApp();

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addWorkout({
      ...workout,
      title: workout.title,
      exercises: workout.exercises.map((ex) => ({
        ...ex,
        id: uid(),
        sets: ex.sets?.map((s) => ({ ...s, id: uid(), done: false })),
      })),
    });
  };

  return (
    <Link
      href={`/workout/${workout.id}`}
      className="tappable group block animate-slide-up"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-white p-2 pr-3 shadow-card">
        <div
          className={cn(
            'grid h-14 w-14 shrink-0 place-items-center rounded-xl',
            EMOJI_BG[workout.emojiBg]
          )}
        >
          <EmojiFace variant={workout.emoji} size={40} />
        </div>
        <div className="min-w-0 flex-1 py-1">
          <div className="flex items-center gap-1.5">
            <span
              className="block h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: MARKER_HEX[workout.marker] }}
            />
            <h3 className="truncate text-[17px] font-semibold tracking-tight text-ink-900">
              {workout.title}
            </h3>
          </div>
          <p className="tabular mt-0.5 text-[14px] text-ink-400">
            {workout.startTime} — {workout.endTime}
          </p>
        </div>
        <button
          onClick={handleDuplicate}
          className="tappable grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          aria-label="Дублировать тренировку"
        >
          <Copy size={18} />
        </button>
      </div>
    </Link>
  );
}
