'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Calendar as CalendarIcon, Bell, Settings, MoreHorizontal } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useApp } from '@/store/app';
import { useAuth } from '@/store/auth';
import { uid } from '@/lib/utils';
import type { Exercise, MarkerColor, WorkoutEmoji } from '@/types';
import { ExerciseRow } from '@/components/ExerciseRow';
import { ExercisePicker } from '@/components/ExercisePicker';

const NOTIFY_OPTIONS = [
  { label: 'Без уведомления', value: 0 },
  { label: 'За 15 минут', value: 15 },
  { label: 'За 30 минут', value: 30 },
  { label: 'За 1 час', value: 60 },
  { label: 'За 2 часа', value: 120 },
];

export default function WorkoutPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { workouts, addWorkout, updateWorkout, deleteWorkout, addExercise } = useApp();
  const user = useAuth((s) => s.user);

  const isNew = params.id === 'new';
  const initialDate = searchParams.get('date') ?? new Date().toISOString().slice(0, 10);

  const [workoutId, setWorkoutId] = useState<string | null>(isNew ? null : params.id);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState('19:00');
  const [endTime, setEndTime] = useState('20:00');
  const [notify, setNotify] = useState(30);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  const workout = useMemo(
    () => workouts.find((w) => w.id === workoutId),
    [workouts, workoutId]
  );

  // Load existing workout
  useEffect(() => {
    if (workout) {
      setTitle(workout.title);
      setDate(workout.date);
      setTime(workout.startTime);
      setEndTime(workout.endTime);
      setNotify(workout.notifyMinutesBefore ?? 0);
    }
  }, [workout]);

  const ensureWorkout = (): string => {
    if (workoutId) return workoutId;
    const id = addWorkout({
      title: title || 'Новая тренировка',
      date,
      startTime: time,
      endTime,
      emoji: 'happy' as WorkoutEmoji,
      emojiBg: 'yellow' as MarkerColor,
      marker: 'blue' as MarkerColor,
      exercises: [],
      notifyMinutesBefore: notify,
      userEmail: user?.email,
    });
    setWorkoutId(id);
    return id;
  };

  const handleAddExercise = (exercise: Exercise) => {
    const id = ensureWorkout();
    addExercise(id, exercise);
  };

  const handleSave = () => {
    if (workoutId) {
      updateWorkout(workoutId, {
        title: title || 'Новая тренировка',
        date,
        startTime: time,
        endTime,
        notifyMinutesBefore: notify,
      });
    } else {
      ensureWorkout();
    }
    router.push('/');
  };

  const handleDelete = () => {
    if (workoutId) {
      deleteWorkout(workoutId);
      router.push('/');
    } else {
      router.back();
    }
  };

  const exercises = workout?.exercises ?? [];

  return (
    <>
      <header
        className="shrink-0 border-b border-ink-100 bg-white"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-5 py-3">
          <button
            onClick={() => router.back()}
            className="tappable -ml-2 grid h-9 w-9 place-items-center rounded-full text-ink-900"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-[17px] font-semibold tracking-tight text-ink-900">
            {isNew ? 'Новая тренировка' : 'Тренировка'}
          </h1>
          <button
            className="tappable -mr-2 grid h-9 w-9 place-items-center rounded-full text-ink-700"
            onClick={() => setActionsOpen(true)}
          >
            <MoreHorizontal size={22} />
          </button>
        </div>
      </header>

      <main className="no-scrollbar scroll-smooth-momentum flex-1 overflow-y-auto bg-white">
        <div className="space-y-5 px-5 pb-32 pt-5">
          {/* Title row */}
          <div className="flex items-start justify-between gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название тренировки"
              className="min-w-0 flex-1 bg-transparent text-[18px] font-semibold tracking-tight text-ink-900 placeholder:text-ink-300 focus:outline-none"
            />
            <button className="tappable shrink-0 rounded-full border border-brand px-4 py-1.5 text-[13px] font-semibold text-brand">
              Настройки
            </button>
          </div>

          {/* Date / time / notify row */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-[14px]">
            <label className="flex items-center gap-2 text-ink-700">
              <CalendarIcon size={18} className="text-ink-500" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="tabular bg-transparent text-ink-900 focus:outline-none"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  // auto-adjust end time +1h if before
                  const [h, m] = e.target.value.split(':').map(Number);
                  const end = `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                  setEndTime(end);
                }}
                className="tabular bg-transparent text-ink-900 focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-2 text-ink-700">
              <Bell size={18} className="text-ink-500" />
              <select
                value={notify}
                onChange={(e) => setNotify(Number(e.target.value))}
                className="bg-transparent text-ink-900 focus:outline-none"
              >
                {NOTIFY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="border-t border-ink-100 pt-4">
            <button
              onClick={() => setPickerOpen(true)}
              className="tappable text-[15px] font-medium text-brand"
            >
              + Добавить упражнение
            </button>
          </div>

          <div className="space-y-2 border-t border-ink-100 pt-4">
            {exercises.length === 0 ? (
              <p className="py-8 text-center text-[14px] text-ink-400">
                Упражнения ещё не добавлены
              </p>
            ) : (
              exercises.map((ex) => (
                <ExerciseRow
                  key={ex.id}
                  workoutId={workoutId!}
                  exercise={ex}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {/* Bottom action bar */}
      <div
        className="shrink-0 border-t border-ink-100 bg-white px-5 py-3"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActionsOpen(true)}
            className="tappable grid h-12 w-12 place-items-center rounded-2xl border border-brand text-brand"
            aria-label="Действия"
          >
            <ActionsIcon />
          </button>
          <button
            onClick={handleSave}
            className="tappable flex-1 rounded-full border border-brand px-5 py-3 text-[15px] font-semibold text-brand"
          >
            Сохранить
          </button>
          <button
            onClick={() => setActionsOpen(true)}
            className="tappable flex-1 rounded-full bg-brand px-5 py-3 text-[15px] font-semibold text-white shadow-fab"
          >
            Действия
          </button>
        </div>
      </div>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handleAddExercise}
      />

      <ActionsSheet
        open={actionsOpen}
        onClose={() => setActionsOpen(false)}
        onDelete={handleDelete}
        isNew={isNew}
      />
    </>
  );
}

function ActionsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path
        d="M5 6c1-1 2.5-1 3.5 0M13.5 6c1-1 2.5-1 3.5 0M5 16c1 1 2.5 1 3.5 0M13.5 16c1 1 2.5 1 3.5 0M3 11h16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ActionsSheet({
  open,
  onClose,
  onDelete,
  isNew,
}: {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  isNew: boolean;
}) {
  if (!open) return null;
  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-ink-900/40"
      />
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[440px] animate-slide-up rounded-t-3xl bg-white p-5 shadow-elevated"
        style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink-200" />
        <h3 className="mb-3 text-[17px] font-semibold tracking-tight text-ink-900">
          Действия с тренировкой
        </h3>
        <div className="space-y-1">
          <ActionItem label="Дублировать" onClick={onClose} />
          <ActionItem label="Поделиться" onClick={onClose} />
          <ActionItem label="Отметить выполненной" onClick={onClose} />
          {!isNew && (
            <ActionItem label="Удалить" danger onClick={onDelete} />
          )}
        </div>
      </div>
    </>
  );
}

function ActionItem({
  label,
  danger,
  onClick,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`tappable flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-[15px] font-medium hover:bg-ink-50 ${
        danger ? 'text-marker-red' : 'text-ink-900'
      }`}
    >
      {label}
    </button>
  );
}
