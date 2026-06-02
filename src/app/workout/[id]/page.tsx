'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Calendar as CalendarIcon, Bell } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useApp } from '@/store/app';
import { uid, EMOJI_BG, MARKER_HEX } from '@/lib/utils';
import type { Exercise, MarkerColor, WorkoutEmoji } from '@/types';
import { ExerciseRow } from '@/components/ExerciseRow';
import { ExercisePicker } from '@/components/ExercisePicker';
import { EmojiFace } from '@/components/EmojiFace';

const MOODS: { emoji: WorkoutEmoji; color: MarkerColor; label: string }[] = [
  { emoji: 'fire',    color: 'red',    label: 'Я в восторге!' },
  { emoji: 'happy',   color: 'orange', label: 'Кайфую' },
  { emoji: 'wink',    color: 'yellow', label: 'Мне хорошо!' },
  { emoji: 'cool',    color: 'cyan',   label: 'Спокойное настроение' },
  { emoji: 'sleepy',  color: 'blue',   label: 'Как-то грустно' },
  { emoji: 'flex',    color: 'purple', label: 'Тяжко совсем' },
  { emoji: 'neutral', color: 'gray',   label: 'Полный упадок сил' },
];
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  const { workouts, addWorkout, updateWorkout, deleteWorkout, addExercise, reorderExercises } = useApp();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

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
  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

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
      emoji: 'neutral' as WorkoutEmoji,
      emojiBg: 'gray' as MarkerColor,
      marker: 'gray' as MarkerColor,
      icon: '/img/normal.svg',
      exercises: [],
      notifyMinutesBefore: notify,
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
          <div className="h-9 w-9" />
        </div>
      </header>

      <main className="no-scrollbar scroll-smooth-momentum flex-1 overflow-y-auto bg-white">
        <div className="space-y-5 px-5 pb-32 pt-5">
          {/* Title row */}
          <div className="flex items-start">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название тренировки"
              className="min-w-0 flex-1 bg-transparent text-[18px] font-semibold tracking-tight text-ink-900 placeholder:text-ink-300 focus:outline-none"
            />
          </div>

          {/* Date / time / notify — single row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-ink-700">
            <button
              type="button"
              onClick={() => dateInputRef.current?.showPicker?.()}
              className="text-ink-500"
              aria-label="Выбрать дату"
            >
              <CalendarIcon size={18} />
            </button>
            <input
              ref={dateInputRef}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="tabular bg-transparent text-ink-900 focus:outline-none [&::-webkit-calendar-picker-indicator]:hidden"
            />
            <input
              ref={timeInputRef}
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                const [h, m] = e.target.value.split(':').map(Number);
                const end = `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                setEndTime(end);
              }}
              className="tabular bg-transparent text-ink-900 focus:outline-none [&::-webkit-calendar-picker-indicator]:hidden"
            />
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
          </div>

          <div className="border-t border-ink-100 pt-4">
            <button
              onClick={() => setPickerOpen(true)}
              className="tappable text-[15px] font-medium text-brand"
            >
              + Добавить упражнение
            </button>
          </div>

          <div className="border-t border-ink-100 pt-4">
            {exercises.length === 0 ? (
              <p className="py-8 text-center text-[14px] text-ink-400">
                Упражнения ещё не добавлены
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event: DragEndEvent) => {
                  const { active, over } = event;
                  if (!over || active.id === over.id || !workoutId) return;
                  const fromIndex = exercises.findIndex((e) => e.id === active.id);
                  const toIndex = exercises.findIndex((e) => e.id === over.id);
                  if (fromIndex !== -1 && toIndex !== -1) {
                    reorderExercises(workoutId, fromIndex, toIndex);
                  }
                }}
              >
                <SortableContext items={exercises.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {exercises.map((ex) => (
                      <SortableExerciseRow key={ex.id} workoutId={workoutId!} exercise={ex} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
        onMood={(emoji, color) => {
          if (workoutId) {
            updateWorkout(workoutId, { emoji, emojiBg: color, marker: color, icon: '' });
          }
        }}
      />
    </>
  );
}

function SortableExerciseRow({ workoutId, exercise }: { workoutId: string; exercise: Exercise }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: exercise.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <ExerciseRow
        workoutId={workoutId}
        exercise={exercise}
        dragHandleListeners={listeners}
        dragHandleAttributes={attributes}
        isDragging={isDragging}
      />
    </div>
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
  onMood,
}: {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  isNew: boolean;
  onMood: (emoji: WorkoutEmoji, color: MarkerColor) => void;
}) {
  const [showMood, setShowMood] = useState(false);

  if (!open) return null;

  if (showMood) {
    return (
      <>
        <div onClick={onClose} className="fixed inset-0 z-40 bg-ink-900/40" />
        <div
          className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[440px] animate-slide-up rounded-t-3xl bg-white p-5 shadow-elevated"
          style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink-200" />
          <h3 className="mb-4 text-[17px] font-semibold tracking-tight text-ink-900">
            Как ощущения?
          </h3>
          <div className="space-y-1">
            {MOODS.map((m) => (
              <button
                key={m.color}
                onClick={() => { onMood(m.emoji, m.color); onClose(); setShowMood(false); }}
                className="tappable flex w-full items-center gap-3 rounded-xl px-2 py-2 hover:bg-ink-50"
              >
                <div
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                  style={{ backgroundColor: `${MARKER_HEX[m.color]}22` }}
                >
                  <EmojiFace variant={m.emoji} size={32} />
                </div>
                <span className="text-[15px] font-medium text-ink-900">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-ink-900/40" />
      <div
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[440px] animate-slide-up rounded-t-3xl bg-white p-5 shadow-elevated"
        style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink-200" />
        <h3 className="mb-3 text-[17px] font-semibold tracking-tight text-ink-900">
          Действия с тренировкой
        </h3>
        <div className="space-y-1">
          <ActionItem label="Оценить тренировку" onClick={() => setShowMood(true)} />
          <ActionItem label="Дублировать" onClick={onClose} />
          <ActionItem label="Поделиться" onClick={onClose} />
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
