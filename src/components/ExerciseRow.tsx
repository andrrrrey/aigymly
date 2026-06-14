'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Trash2, Plus, X, Clock, GripVertical } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, type PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useApp } from '@/store/app';
import type { Exercise } from '@/types';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import type { DraggableAttributes } from '@dnd-kit/core';

interface Props {
  workoutId: string;
  exercise: Exercise;
  dragHandleListeners?: SyntheticListenerMap;
  dragHandleAttributes?: DraggableAttributes;
  isDragging?: boolean;
}

export function ExerciseRow({ workoutId, exercise, dragHandleListeners, dragHandleAttributes, isDragging }: Props) {
  const [open, setOpen] = useState(false);
  const { addSet, updateSet, removeSet, removeExercise } = useApp();
  const x = useMotionValue(0);

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    // Swipe far enough to the left → delete. Otherwise framer springs back to 0.
    if (info.offset.x < -80) {
      removeExercise(workoutId, exercise.id);
    }
  };

  return (
    <div className="relative">
      {/* Red layer revealed while swiping left */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-end rounded-2xl bg-marker-red pr-6">
        <div className="flex items-center gap-1.5 text-white">
          <Trash2 size={18} />
          <span className="text-[13px] font-semibold">Удалить</span>
        </div>
      </div>
      <motion.div
        style={{ x }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.7, right: 0 }}
        onDragEnd={handleDragEnd}
        className={cn('relative overflow-hidden rounded-2xl bg-white shadow-card', isDragging && 'opacity-50')}
      >
      <button
        onClick={() => setOpen((v) => !v)}
        className="tappable flex w-full items-center gap-3 px-3 py-3 text-left"
      >
        <button
          type="button"
          className="touch-none text-ink-300 hover:text-ink-500 shrink-0 cursor-grab active:cursor-grabbing"
          {...dragHandleListeners}
          {...dragHandleAttributes}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={18} />
        </button>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-100">
          <ExerciseIcon kind={exercise.kind} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-medium tracking-tight text-ink-900">
            {exercise.name}
          </div>
          <div className="text-[12px] text-ink-400">
            {exercise.kind === 'strength'
              ? `${exercise.sets?.length ?? 0} подходов`
              : `${Math.round((exercise.durationSec ?? 0) / 60)} мин`}
          </div>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-ink-400"
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-ink-100 px-3 pb-3 pt-3">
              {exercise.kind === 'strength' ? (
                <StrengthSets
                  workoutId={workoutId}
                  exercise={exercise}
                  onAdd={() => addSet(workoutId, exercise.id)}
                  onUpdate={(setId, patch) => updateSet(workoutId, exercise.id, setId, patch)}
                  onRemove={(setId) => removeSet(workoutId, exercise.id, setId)}
                />
              ) : (
                <CardioInput
                  exercise={exercise}
                  onChange={() => { /* could update via separate action */ }}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </div>
  );
}

function StrengthSets({
  exercise,
  onAdd,
  onUpdate,
  onRemove,
}: {
  workoutId: string;
  exercise: Exercise;
  onAdd: () => void;
  onUpdate: (setId: string, patch: Partial<{ reps: number; weightKg: number; done: boolean }>) => void;
  onRemove: (setId: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[24px_1fr_1fr_32px_32px] items-center gap-2 px-1 pb-1 text-[11px] uppercase tracking-wider text-ink-400">
        <div>#</div>
        <div>Вес, кг</div>
        <div>Повторы</div>
        <div />
        <div />
      </div>
      {(exercise.sets ?? []).map((set, idx) => (
        <div
          key={set.id}
          className={cn(
            'grid grid-cols-[24px_1fr_1fr_32px_32px] items-center gap-2 rounded-lg px-1 py-1.5',
            set.done && 'bg-marker-green/10'
          )}
        >
          <div className="tabular text-[14px] font-medium text-ink-500">{idx + 1}</div>
          <NumberInput
            value={set.weightKg}
            onChange={(v) => onUpdate(set.id, { weightKg: v })}
            min={0}
            max={999}
            step={2.5}
            decimal
          />
          <NumberInput
            value={set.reps}
            onChange={(v) => onUpdate(set.id, { reps: v })}
            min={0}
            max={999}
          />
          <button
            onClick={() => onUpdate(set.id, { done: !set.done })}
            className={cn(
              'tappable grid h-8 w-8 place-items-center rounded-md transition-colors',
              set.done
                ? 'bg-marker-green text-white'
                : 'border border-ink-200 text-ink-300 hover:border-ink-400'
            )}
            aria-label="Отметить выполненным"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 7l3 3 5-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            onClick={() => onRemove(set.id)}
            className="tappable grid h-8 w-8 place-items-center rounded-md text-ink-300 hover:bg-marker-red/10 hover:text-marker-red"
            aria-label="Удалить подход"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <button
        onClick={onAdd}
        className="tappable mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink-200 py-2 text-[13px] font-medium text-ink-500 hover:border-brand hover:text-brand"
      >
        <Plus size={14} />
        Добавить подход
      </button>
    </div>
  );
}

function CardioInput({
  exercise,
}: {
  exercise: Exercise;
  onChange: () => void;
}) {
  const [min, setMin] = useState(Math.floor((exercise.durationSec ?? 0) / 60));
  return (
    <div className="flex items-center gap-3">
      <Clock size={18} className="text-ink-400" />
      <span className="text-[14px] text-ink-500">Продолжительность</span>
      <div className="ml-auto flex items-center gap-1">
        <input
          type="number"
          value={min}
          onChange={(e) => setMin(Number(e.target.value) || 0)}
          className="tabular w-16 rounded-md border border-ink-200 px-2 py-1.5 text-right text-[14px] font-medium text-ink-900 focus:border-brand focus:outline-none"
        />
        <span className="text-[14px] text-ink-500">мин</span>
      </div>
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  decimal = false,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  decimal?: boolean;
}) {
  // Keep a local string so the field can be cleared on mobile (a stuck "0"
  // otherwise produces values like "015"). A 0 value is shown as an empty
  // field with a "0" placeholder instead of a literal zero.
  const [text, setText] = useState(() => (value === 0 ? '' : String(value)));

  useEffect(() => {
    const parsed = text === '' ? 0 : decimal ? parseFloat(text) : parseInt(text, 10);
    if (parsed !== value) setText(value === 0 ? '' : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="number"
      inputMode={decimal ? 'decimal' : 'numeric'}
      value={text}
      placeholder="0"
      step={step}
      min={min}
      max={max}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        if (raw === '') {
          onChange(0);
          return;
        }
        const v = decimal ? parseFloat(raw) : parseInt(raw, 10);
        if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
      }}
      className="tabular w-full rounded-md border border-ink-200 bg-white px-2 py-1.5 text-center text-[14px] font-medium text-ink-900 focus:border-brand focus:outline-none"
    />
  );
}

function ExerciseIcon({ kind }: { kind: 'strength' | 'cardio' }) {
  if (kind === 'cardio') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M3 14l3-4 3 2 4-6 4 5"
          stroke="#5C6677"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M3 8v4M17 8v4M5 6v8M15 6v8M7 10h6"
        stroke="#5C6677"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
