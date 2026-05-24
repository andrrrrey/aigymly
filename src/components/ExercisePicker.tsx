'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { EXERCISE_LIBRARY, MUSCLE_GROUPS_RU, createExerciseFromTemplate, type ExerciseTemplate } from '@/lib/exercises';
import { cn } from '@/lib/utils';
import type { Exercise } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (exercise: Exercise) => void;
}

export function ExercisePicker({ open, onClose, onPick }: Props) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string>('Все');

  const filtered = useMemo(() => {
    return EXERCISE_LIBRARY.filter((e) => {
      if (group !== 'Все' && e.muscleGroupRu !== group) return false;
      if (query) {
        const q = query.toLowerCase().trim();
        return e.nameRu.toLowerCase().includes(q) || e.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [query, group]);

  const handlePick = (tpl: ExerciseTemplate) => {
    onPick(createExerciseFromTemplate(tpl));
    onClose();
    setQuery('');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
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
            <div className="flex shrink-0 items-center justify-between px-5 pb-3">
              <h3 className="text-[18px] font-semibold tracking-tight text-ink-900">
                Выбери упражнение
              </h3>
              <button
                onClick={onClose}
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
                      'tappable shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors',
                      group === g
                        ? 'bg-brand text-white'
                        : 'bg-ink-100 text-ink-700'
                    )}
                  >
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
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-100 text-[13px] font-semibold text-ink-500">
                      {ex.muscleGroupRu.slice(0, 1)}
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
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
