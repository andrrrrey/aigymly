'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Copy,
  Dumbbell,
  Loader2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { ExercisePicker } from '@/components/ExercisePicker';
import { uid } from '@/lib/utils';
import type { Exercise, ExerciseSet, Program, ProgramDay, ProgramSchedule } from '@/types';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const DEFAULT_SCHEDULE: ProgramSchedule = {
  weeksTotal: 4,
  preferredDays: [],
  startTime: '18:00',
  durationMin: 60,
  notifyMinutesBefore: 0,
};

function newDay(index: number): ProgramDay {
  return { id: uid(), title: `Тренировка ${index + 1}`, exercises: [] };
}

function cloneExercise(exercise: Exercise): Exercise {
  return {
    ...exercise,
    id: uid(),
    sets: exercise.sets?.map((set) => ({ ...set, id: uid(), done: false })),
  };
}

function cloneDay(day: ProgramDay, index: number): ProgramDay {
  return {
    ...day,
    id: uid(),
    title: `${day.title} — копия`,
    weekday: undefined,
    exercises: day.exercises.map(cloneExercise),
  };
}

export function ProgramBuilder({ programId }: { programId?: string }) {
  const router = useRouter();
  const editing = !!programId;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState<ProgramDay[]>([newDay(0)]);
  const [schedule, setSchedule] = useState<ProgramSchedule>(DEFAULT_SCHEDULE);
  const [pickerDayId, setPickerDayId] = useState<string | null>(null);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!programId) return;
    let active = true;
    fetch(`/api/programs/${programId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('LOAD_FAILED');
        return res.json() as Promise<Program>;
      })
      .then((program) => {
        if (!active) return;
        if (program.source !== 'manual') {
          router.replace(`/programs/${programId}`);
          return;
        }
        setTitle(program.title);
        setDescription(program.description ?? '');
        setDays(program.blocks?.[0]?.days ?? program.days ?? []);
        setSchedule({ ...DEFAULT_SCHEDULE, ...program.schedule, weeksTotal: program.weeksTotal ?? program.schedule?.weeksTotal ?? 4 });
      })
      .catch(() => active && setError('Не удалось загрузить программу.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [programId, router]);

  const updateDay = (dayId: string, patch: Partial<ProgramDay>) => {
    setDays((current) => current.map((day) => (day.id === dayId ? { ...day, ...patch } : day)));
  };

  const addExercise = (dayId: string, exercise: Exercise) => {
    setDays((current) => current.map((day) =>
      day.id === dayId ? { ...day, exercises: [...day.exercises, exercise] } : day
    ));
  };

  const updateExercise = (dayId: string, exerciseId: string, patch: Partial<Exercise>) => {
    setDays((current) => current.map((day) =>
      day.id === dayId
        ? { ...day, exercises: day.exercises.map((exercise) => exercise.id === exerciseId ? { ...exercise, ...patch } : exercise) }
        : day
    ));
  };

  const removeExercise = (dayId: string, exerciseId: string) => {
    setDays((current) => current.map((day) =>
      day.id === dayId
        ? { ...day, exercises: day.exercises.filter((exercise) => exercise.id !== exerciseId) }
        : day
    ));
  };

  const moveExercise = (dayId: string, index: number, direction: -1 | 1) => {
    setDays((current) => current.map((day) => {
      if (day.id !== dayId) return day;
      const target = index + direction;
      if (target < 0 || target >= day.exercises.length) return day;
      const exercises = [...day.exercises];
      [exercises[index], exercises[target]] = [exercises[target], exercises[index]];
      return { ...day, exercises };
    }));
  };

  const save = async () => {
    setError('');
    if (!title.trim()) return setError('Введите название программы.');
    if (!days.length) return setError('Добавьте хотя бы одну тренировку.');
    if (days.some((day) => !day.exercises.length)) {
      return setError('В каждой тренировке должно быть хотя бы одно упражнение.');
    }
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/programs/${programId}` : '/api/programs', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, status: 'active', days, weeksTotal: schedule.weeksTotal, schedule }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.id) throw new Error('SAVE_FAILED');
      router.push(`/programs/${data.id}`);
      router.refresh();
    } catch {
      setError('Не удалось сохранить программу. Попробуйте ещё раз.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="grid flex-1 place-items-center bg-white"><Loader2 className="animate-spin text-brand" /></main>;
  }

  return (
    <>
      <header className="shrink-0 border-b border-ink-100 bg-white" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center gap-2 px-4 py-3">
          <button onClick={() => router.back()} className="tappable grid h-9 w-9 place-items-center rounded-full text-ink-800">
            <ChevronLeft size={22} />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-[17px] font-semibold text-ink-900">
            {editing ? 'Редактирование программы' : 'Новая программа'}
          </h1>
          <button onClick={save} disabled={saving} className="tappable flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Сохранить
          </button>
        </div>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto bg-ink-50 px-5 pb-28 pt-5">
        <section className="rounded-2xl border border-ink-100 bg-white p-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            placeholder="Название программы"
            className="w-full bg-transparent text-[20px] font-semibold text-ink-900 placeholder:text-ink-300 focus:outline-none"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Описание программы — необязательно"
            className="mt-2 w-full resize-none bg-transparent text-[14px] leading-relaxed text-ink-600 placeholder:text-ink-300 focus:outline-none"
          />
        </section>

        <section className="mt-4 rounded-2xl border border-ink-100 bg-white p-4">
          <h2 className="text-[15px] font-semibold text-ink-900">Расписание по умолчанию</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <NumberField label="Недель" value={schedule.weeksTotal} min={1} max={52} onChange={(weeksTotal) => setSchedule({ ...schedule, weeksTotal })} />
            <label className="rounded-xl border border-ink-100 px-3 py-2">
              <span className="block text-[10px] uppercase tracking-wide text-ink-400">Время</span>
              <input type="time" value={schedule.startTime} onChange={(e) => setSchedule({ ...schedule, startTime: e.target.value })} className="mt-1 w-full bg-transparent text-[14px] font-medium focus:outline-none" />
            </label>
            <NumberField label="Минут" value={schedule.durationMin} min={10} max={360} onChange={(durationMin) => setSchedule({ ...schedule, durationMin })} />
          </div>
          <div className="mt-3 flex gap-1.5">
            {WEEKDAYS.map((label, index) => {
              const selected = schedule.preferredDays.includes(index);
              return (
                <button key={label} type="button" onClick={() => setSchedule({ ...schedule, preferredDays: selected ? schedule.preferredDays.filter((day) => day !== index) : [...schedule.preferredDays, index].sort() })} className={`tappable grid h-9 flex-1 place-items-center rounded-lg text-[12px] font-semibold ${selected ? 'bg-brand text-white' : 'bg-ink-100 text-ink-500'}`}>
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        <div className="mb-3 mt-6 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-ink-900">Тренировки</h2>
          <span className="text-[12px] text-ink-400">{days.length} шт.</span>
        </div>

        <div className="space-y-3">
          {days.map((day, index) => (
            <DayEditor
              key={day.id}
              day={day}
              index={index}
              onChange={(patch) => updateDay(day.id, patch)}
              onAddExercise={() => setPickerDayId(day.id)}
              onUpdateExercise={(exerciseId, patch) => updateExercise(day.id, exerciseId, patch)}
              onRemoveExercise={(exerciseId) => removeExercise(day.id, exerciseId)}
              onMoveExercise={(exerciseIndex, direction) => moveExercise(day.id, exerciseIndex, direction)}
              onDuplicate={() => setDays((current) => [...current.slice(0, index + 1), cloneDay(day, index), ...current.slice(index + 1)])}
              onDelete={() => setDays((current) => current.filter((candidate) => candidate.id !== day.id))}
            />
          ))}
        </div>

        <button type="button" onClick={() => setDays((current) => [...current, newDay(current.length)])} className="tappable mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-brand/40 bg-white py-3.5 text-[14px] font-semibold text-brand">
          <Plus size={17} /> Добавить тренировку
        </button>

        {error && <p className="mt-4 rounded-xl bg-marker-red/10 p-3 text-[13px] text-marker-red">{error}</p>}
      </main>

      <ExercisePicker
        open={pickerDayId !== null}
        onClose={() => setPickerDayId(null)}
        onPick={(exercise) => pickerDayId && addExercise(pickerDayId, exercise)}
      />
    </>
  );
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <label className="rounded-xl border border-ink-100 px-3 py-2">
      <span className="block text-[10px] uppercase tracking-wide text-ink-400">{label}</span>
      <input type="number" value={value} min={min} max={max} onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))} className="mt-1 w-full bg-transparent text-[15px] font-semibold focus:outline-none" />
    </label>
  );
}

function DayEditor({ day, index, onChange, onAddExercise, onUpdateExercise, onRemoveExercise, onMoveExercise, onDuplicate, onDelete }: {
  day: ProgramDay;
  index: number;
  onChange: (patch: Partial<ProgramDay>) => void;
  onAddExercise: () => void;
  onUpdateExercise: (exerciseId: string, patch: Partial<Exercise>) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onMoveExercise: (index: number, direction: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
      <div className="flex items-center gap-2 p-4">
        <button type="button" onClick={() => setOpen(!open)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
          <Dumbbell size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <input value={day.title} onChange={(e) => onChange({ title: e.target.value })} maxLength={100} className="w-full bg-transparent text-[15px] font-semibold text-ink-900 focus:outline-none" />
          <div className="text-[12px] text-ink-400">{day.exercises.length} упражнений</div>
        </div>
        <button type="button" onClick={onDuplicate} className="grid h-8 w-8 place-items-center text-ink-400" aria-label="Дублировать"><Copy size={16} /></button>
        <button type="button" onClick={onDelete} className="grid h-8 w-8 place-items-center text-marker-red" aria-label="Удалить"><Trash2 size={16} /></button>
        <button type="button" onClick={() => setOpen(!open)} className="grid h-8 w-8 place-items-center text-ink-400"><ChevronDown size={18} className={open ? 'rotate-180' : ''} /></button>
      </div>

      {open && (
        <div className="border-t border-ink-100 px-4 pb-4 pt-3">
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <input value={day.focus ?? ''} onChange={(e) => onChange({ focus: e.target.value })} placeholder="Фокус: грудь, всё тело…" className="rounded-xl bg-ink-50 px-3 py-2.5 text-[13px] text-ink-800 placeholder:text-ink-300 focus:outline-none" />
            <select value={day.weekday ?? ''} onChange={(e) => onChange({ weekday: e.target.value === '' ? undefined : Number(e.target.value) })} className="rounded-xl bg-ink-50 px-3 py-2.5 text-[13px] text-ink-700 focus:outline-none">
              <option value="">Любой день</option>
              {WEEKDAYS.map((label, weekday) => <option key={label} value={weekday}>{label}</option>)}
            </select>
          </div>
          <textarea value={day.notes ?? ''} onChange={(e) => onChange({ notes: e.target.value })} placeholder="Комментарий к тренировке" rows={2} className="mt-2 w-full resize-none rounded-xl bg-ink-50 px-3 py-2.5 text-[13px] text-ink-700 placeholder:text-ink-300 focus:outline-none" />

          <div className="mt-3 space-y-2">
            {day.exercises.map((exercise, exerciseIndex) => (
              <ExerciseEditor
                key={exercise.id}
                exercise={exercise}
                first={exerciseIndex === 0}
                last={exerciseIndex === day.exercises.length - 1}
                onChange={(patch) => onUpdateExercise(exercise.id, patch)}
                onRemove={() => onRemoveExercise(exercise.id)}
                onMove={(direction) => onMoveExercise(exerciseIndex, direction)}
              />
            ))}
          </div>
          <button type="button" onClick={onAddExercise} className="tappable mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand/10 py-2.5 text-[13px] font-semibold text-brand">
            <Plus size={15} /> Добавить упражнение
          </button>
        </div>
      )}
    </section>
  );
}

function ExerciseEditor({ exercise, first, last, onChange, onRemove, onMove }: {
  exercise: Exercise;
  first: boolean;
  last: boolean;
  onChange: (patch: Partial<Exercise>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const sets = exercise.sets ?? [];
  const updateSet = (setId: string, patch: Partial<ExerciseSet>) => onChange({ sets: sets.map((set) => set.id === setId ? { ...set, ...patch } : set) });
  return (
    <div className="rounded-xl border border-ink-100 p-3">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink-900">{exercise.name}</div>
        <button type="button" disabled={first} onClick={() => onMove(-1)} className="text-ink-400 disabled:opacity-20"><ChevronUp size={16} /></button>
        <button type="button" disabled={last} onClick={() => onMove(1)} className="text-ink-400 disabled:opacity-20"><ChevronDown size={16} /></button>
        <button type="button" onClick={onRemove} className="text-marker-red"><Trash2 size={15} /></button>
      </div>
      {exercise.kind === 'strength' ? (
        <div className="mt-2 space-y-1.5">
          <div className="grid grid-cols-[1fr_1fr_30px] gap-2 px-1 text-[10px] uppercase text-ink-400"><span>Вес, кг</span><span>Повторы</span><span /></div>
          {sets.map((set) => (
            <div key={set.id} className="grid grid-cols-[1fr_1fr_30px] gap-2">
              <input type="number" min="0" step="0.5" value={set.weightKg} onChange={(e) => updateSet(set.id, { weightKg: Number(e.target.value) || 0 })} className="w-full rounded-lg bg-ink-50 px-2 py-2 text-[13px] focus:outline-none" />
              <input type="number" min="0" value={set.reps} onChange={(e) => updateSet(set.id, { reps: Number(e.target.value) || 0 })} className="w-full rounded-lg bg-ink-50 px-2 py-2 text-[13px] focus:outline-none" />
              <button type="button" onClick={() => onChange({ sets: sets.filter((candidate) => candidate.id !== set.id) })} className="text-ink-300"><Trash2 size={14} /></button>
            </div>
          ))}
          <button type="button" onClick={() => onChange({ sets: [...sets, { id: uid(), reps: sets.at(-1)?.reps ?? 10, weightKg: sets.at(-1)?.weightKg ?? 0 }] })} className="text-[12px] font-medium text-brand">+ Подход</button>
        </div>
      ) : (
        <label className="mt-2 flex items-center gap-2 text-[12px] text-ink-500">
          Продолжительность
          <input type="number" min="0" value={Math.round((exercise.durationSec ?? 0) / 60)} onChange={(e) => onChange({ durationSec: (Number(e.target.value) || 0) * 60 })} className="ml-auto w-20 rounded-lg bg-ink-50 px-2 py-2 text-right text-[13px] text-ink-900 focus:outline-none" />
          мин
        </label>
      )}
    </div>
  );
}
