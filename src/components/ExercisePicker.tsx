'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Plus, ChevronLeft } from 'lucide-react';
import { EXERCISE_LIBRARY, MUSCLE_GROUPS_RU, createExerciseFromTemplate, type ExerciseTemplate } from '@/lib/exercises';
import { cn } from '@/lib/utils';
import { useApp } from '@/store/app';
import { MuscleGroupIcon } from './icons/MuscleGroupIcon';
import type { Exercise } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (exercise: Exercise) => void;
}

export function ExercisePicker({ open, onClose, onPick }: Props) {
  const { customExercises, addCustomExercise } = useApp();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string>('Все');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState(MUSCLE_GROUPS_RU[0]);
  const [newKind, setNewKind] = useState<'strength' | 'cardio'>('strength');

  const allExercises = useMemo(
    () => [...EXERCISE_LIBRARY, ...customExercises],
    [customExercises]
  );

  const filtered = useMemo(() => {
    return allExercises.filter((e) => {
      if (group !== 'Все' && e.muscleGroupRu !== group) return false;
      if (query) {
        const q = query.toLowerCase().trim();
        return e.nameRu.toLowerCase().includes(q) || e.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allExercises, query, group]);

  const handlePick = (tpl: ExerciseTemplate) => {
    onPick(createExerciseFromTemplate(tpl));
    onClose();
    setQuery('');
  };

  function handleSaveCustom() {
    const name = newName.trim();
    if (!name) return;
    addCustomExercise({
      id: `custom-${Date.now()}`,
      name,
      nameRu: name,
      kind: newKind,
      muscleGroup: newGroup,
      muscleGroupRu: newGroup,
    });
    setNewName('');
    setNewGroup(MUSCLE_GROUPS_RU[0]);
    setNewKind('strength');
    setShowAddForm(false);
  }

  function handleClose() {
    onClose();
    setQuery('');
    setShowAddForm(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-ink-900/40"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[80vh] max-w-[440px] flex-col rounded-t-3xl bg-white shadow-elevated"
          >
            <div className="flex shrink-0 items-center justify-between px-5 pb-2 pt-4">
              <div className="mx-auto h-1 w-10 rounded-full bg-ink-200" />
            </div>

            {showAddForm ? (
              /* ── Add custom exercise form ── */
              <>
                <div className="flex shrink-0 items-center gap-2 px-5 pb-3">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="tappable -ml-1 grid h-9 w-9 place-items-center rounded-full text-ink-500"
                    aria-label="Назад"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <h3 className="flex-1 text-[18px] font-semibold tracking-tight text-ink-900">
                    Своё упражнение
                  </h3>
                  <button
                    onClick={handleClose}
                    className="tappable -mr-2 grid h-9 w-9 place-items-center rounded-full text-ink-500"
                    aria-label="Закрыть"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 pb-8">
                  <div className="space-y-4">
                    {/* Name input */}
                    <div>
                      <label className="mb-1.5 block text-[13px] font-medium text-ink-500">
                        Название
                      </label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Например: Тяга резинки стоя"
                        className="w-full rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-[15px] text-ink-900 placeholder:text-ink-400 focus:border-brand focus:outline-none"
                        autoFocus
                      />
                    </div>

                    {/* Muscle group */}
                    <div>
                      <label className="mb-1.5 block text-[13px] font-medium text-ink-500">
                        Группа мышц
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {MUSCLE_GROUPS_RU.map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setNewGroup(g)}
                            className={cn(
                              'tappable flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors',
                              newGroup === g
                                ? 'bg-brand text-white'
                                : 'bg-ink-100 text-ink-700'
                            )}
                          >
                            <span className={cn('opacity-80', newGroup === g && 'opacity-100')}>
                              <MuscleGroupIcon group={g} size={14} />
                            </span>
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Kind toggle */}
                    <div>
                      <label className="mb-1.5 block text-[13px] font-medium text-ink-500">
                        Тип
                      </label>
                      <div className="flex gap-2">
                        {(['strength', 'cardio'] as const).map((k) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setNewKind(k)}
                            className={cn(
                              'tappable flex-1 rounded-xl py-2.5 text-[14px] font-medium transition-colors',
                              newKind === k
                                ? 'bg-brand text-white'
                                : 'bg-ink-100 text-ink-700'
                            )}
                          >
                            {k === 'strength' ? 'Силовое' : 'Кардио'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Save button */}
                    <button
                      type="button"
                      onClick={handleSaveCustom}
                      disabled={!newName.trim()}
                      className="tappable w-full rounded-2xl bg-brand py-3.5 text-[15px] font-semibold text-white disabled:opacity-40"
                    >
                      Добавить упражнение
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* ── Exercise list ── */
              <>
                <div className="flex shrink-0 items-center justify-between px-5 pb-3">
                  <h3 className="text-[18px] font-semibold tracking-tight text-ink-900">
                    Выбери упражнение
                  </h3>
                  <button
                    onClick={handleClose}
                    className="tappable -mr-2 grid h-9 w-9 place-items-center rounded-full text-ink-500"
                    aria-label="Закрыть"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="shrink-0 px-5 pb-3">
                  <div className="flex items-center gap-2 rounded-xl bg-ink-100 px-3 py-2.5">
                    <Search size={18} className="text-ink-400" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Поиск упражнения"
                      className="w-full bg-transparent text-[15px] text-ink-900 placeholder:text-ink-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="no-scrollbar shrink-0 overflow-x-auto px-5 pb-3">
                  <div className="flex gap-2">
                    {['Все', ...MUSCLE_GROUPS_RU].map((g) => (
                      <button
                        key={g}
                        onClick={() => setGroup(g)}
                        className={cn(
                          'tappable shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors',
                          group === g
                            ? 'bg-brand text-white'
                            : 'bg-ink-100 text-ink-700'
                        )}
                      >
                        {g !== 'Все' && (
                          <span className="opacity-70">
                            <MuscleGroupIcon group={g} size={13} />
                          </span>
                        )}
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-8">
                  <div className="space-y-1">
                    {filtered.map((ex) => (
                      <button
                        key={ex.id}
                        onClick={() => handlePick(ex)}
                        className="tappable flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-ink-50"
                      >
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-500">
                          <MuscleGroupIcon group={ex.muscleGroupRu} size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[15px] font-medium text-ink-900">
                            {ex.nameRu}
                          </div>
                          <div className="text-[12px] text-ink-400">
                            {ex.muscleGroupRu} · {ex.kind === 'cardio' ? 'Кардио' : 'Силовое'}
                          </div>
                        </div>
                      </button>
                    ))}
                    {filtered.length === 0 && (
                      <div className="py-8 text-center text-[14px] text-ink-400">
                        Ничего не найдено
                      </div>
                    )}

                    {/* Add custom exercise button */}
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="tappable mt-2 flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-ink-50"
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                        <Plus size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[15px] font-medium text-brand">
                          Добавить своё упражнение
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
