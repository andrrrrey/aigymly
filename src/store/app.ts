'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Workout, Exercise, ExerciseSet, QuestionnaireAnswers } from '@/types';
import type { ExerciseTemplate } from '@/lib/exercises';
import { uid } from '@/lib/utils';

interface AppState {
  workouts: Workout[];
  selectedDate: string; // ISO yyyy-MM-dd
  questionnaire: QuestionnaireAnswers;
  customExercises: ExerciseTemplate[];

  setSelectedDate: (date: string) => void;
  addCustomExercise: (template: ExerciseTemplate) => void;
  loadWorkouts: () => Promise<void>;
  clearWorkouts: () => void;
  addWorkout: (workout: Omit<Workout, 'id'>) => string;
  updateWorkout: (id: string, patch: Partial<Workout>) => void;
  deleteWorkout: (id: string) => void;
  getWorkout: (id: string) => Workout | undefined;
  addExercise: (workoutId: string, exercise: Exercise) => void;
  removeExercise: (workoutId: string, exerciseId: string) => void;
  addSet: (workoutId: string, exerciseId: string) => void;
  updateSet: (workoutId: string, exerciseId: string, setId: string, patch: Partial<ExerciseSet>) => void;
  removeSet: (workoutId: string, exerciseId: string, setId: string) => void;

  updateQuestionnaire: (patch: Partial<QuestionnaireAnswers>) => void;
  resetQuestionnaire: () => void;
}

function syncCreate(workout: Workout) {
  fetch('/api/workouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workout),
  }).catch(console.error);
}

function syncUpdate(id: string, patch: Partial<Workout>) {
  fetch(`/api/workouts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).catch(console.error);
}

function syncDelete(id: string) {
  fetch(`/api/workouts/${id}`, { method: 'DELETE' }).catch(console.error);
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      workouts: [],
      selectedDate: new Date().toISOString().slice(0, 10),
      questionnaire: {},
      customExercises: [],

      setSelectedDate: (date) => set({ selectedDate: date }),

      addCustomExercise: (template) =>
        set((s) => ({ customExercises: [...s.customExercises, template] })),

      loadWorkouts: async () => {
        try {
          const res = await fetch('/api/workouts');
          if (res.ok) {
            const workouts: Workout[] = await res.json();
            set({ workouts });
          } else if (res.status === 401) {
            set({ workouts: [] });
          }
        } catch (err) {
          console.error('[loadWorkouts]', err);
        }
      },

      clearWorkouts: () => set({ workouts: [] }),

      addWorkout: (workout) => {
        const id = uid();
        const full: Workout = { ...workout, id };
        set((s) => ({ workouts: [...s.workouts, full] }));
        syncCreate(full);
        return id;
      },

      updateWorkout: (id, patch) => {
        set((s) => ({
          workouts: s.workouts.map((w) => (w.id === id ? { ...w, ...patch } : w)),
        }));
        syncUpdate(id, patch);
      },

      deleteWorkout: (id) => {
        set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) }));
        syncDelete(id);
      },

      getWorkout: (id) => get().workouts.find((w) => w.id === id),

      addExercise: (workoutId, exercise) => {
        set((s) => ({
          workouts: s.workouts.map((w) =>
            w.id === workoutId ? { ...w, exercises: [...w.exercises, exercise] } : w
          ),
        }));
        const updated = get().workouts.find((w) => w.id === workoutId);
        if (updated) syncUpdate(workoutId, { exercises: updated.exercises });
      },

      removeExercise: (workoutId, exerciseId) => {
        set((s) => ({
          workouts: s.workouts.map((w) =>
            w.id === workoutId
              ? { ...w, exercises: w.exercises.filter((e) => e.id !== exerciseId) }
              : w
          ),
        }));
        const updated = get().workouts.find((w) => w.id === workoutId);
        if (updated) syncUpdate(workoutId, { exercises: updated.exercises });
      },

      addSet: (workoutId, exerciseId) => {
        set((s) => ({
          workouts: s.workouts.map((w) => {
            if (w.id !== workoutId) return w;
            return {
              ...w,
              exercises: w.exercises.map((e) => {
                if (e.id !== exerciseId || e.kind !== 'strength') return e;
                const last = e.sets?.[e.sets.length - 1];
                return {
                  ...e,
                  sets: [
                    ...(e.sets ?? []),
                    {
                      id: uid(),
                      reps: last?.reps ?? 10,
                      weightKg: last?.weightKg ?? 0,
                    },
                  ],
                };
              }),
            };
          }),
        }));
        const updated = get().workouts.find((w) => w.id === workoutId);
        if (updated) syncUpdate(workoutId, { exercises: updated.exercises });
      },

      updateSet: (workoutId, exerciseId, setId, patch) => {
        set((s) => ({
          workouts: s.workouts.map((w) => {
            if (w.id !== workoutId) return w;
            return {
              ...w,
              exercises: w.exercises.map((e) => {
                if (e.id !== exerciseId || e.kind !== 'strength') return e;
                return {
                  ...e,
                  sets: (e.sets ?? []).map((st) =>
                    st.id === setId ? { ...st, ...patch } : st
                  ),
                };
              }),
            };
          }),
        }));
        const updated = get().workouts.find((w) => w.id === workoutId);
        if (updated) syncUpdate(workoutId, { exercises: updated.exercises });
      },

      removeSet: (workoutId, exerciseId, setId) => {
        set((s) => ({
          workouts: s.workouts.map((w) => {
            if (w.id !== workoutId) return w;
            return {
              ...w,
              exercises: w.exercises.map((e) => {
                if (e.id !== exerciseId || e.kind !== 'strength') return e;
                return { ...e, sets: (e.sets ?? []).filter((st) => st.id !== setId) };
              }),
            };
          }),
        }));
        const updated = get().workouts.find((w) => w.id === workoutId);
        if (updated) syncUpdate(workoutId, { exercises: updated.exercises });
      },

      updateQuestionnaire: (patch) =>
        set((s) => ({ questionnaire: { ...s.questionnaire, ...patch } })),

      resetQuestionnaire: () => set({ questionnaire: {} }),
    }),
    {
      name: 'aigymly-store',
      storage: createJSONStorage(() => localStorage),
      // Exclude workouts from localStorage — they live in the database
      partialize: (state) => ({
        selectedDate: state.selectedDate,
        questionnaire: state.questionnaire,
        customExercises: state.customExercises,
      }),
    }
  )
);
