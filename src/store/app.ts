'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Workout, Exercise, ExerciseSet, QuestionnaireAnswers } from '@/types';
import { uid } from '@/lib/utils';

interface AppState {
  workouts: Workout[];
  selectedDate: string; // ISO yyyy-MM-dd
  questionnaire: QuestionnaireAnswers;

  setSelectedDate: (date: string) => void;
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

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      workouts: [],
      selectedDate: new Date().toISOString().slice(0, 10),
      questionnaire: {},

      setSelectedDate: (date) => set({ selectedDate: date }),

      addWorkout: (workout) => {
        const id = uid();
        set((s) => ({ workouts: [...s.workouts, { ...workout, id }] }));
        return id;
      },

      updateWorkout: (id, patch) =>
        set((s) => ({
          workouts: s.workouts.map((w) => (w.id === id ? { ...w, ...patch } : w)),
        })),

      deleteWorkout: (id) =>
        set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) })),

      getWorkout: (id) => get().workouts.find((w) => w.id === id),

      addExercise: (workoutId, exercise) =>
        set((s) => ({
          workouts: s.workouts.map((w) =>
            w.id === workoutId ? { ...w, exercises: [...w.exercises, exercise] } : w
          ),
        })),

      removeExercise: (workoutId, exerciseId) =>
        set((s) => ({
          workouts: s.workouts.map((w) =>
            w.id === workoutId
              ? { ...w, exercises: w.exercises.filter((e) => e.id !== exerciseId) }
              : w
          ),
        })),

      addSet: (workoutId, exerciseId) =>
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
        })),

      updateSet: (workoutId, exerciseId, setId, patch) =>
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
        })),

      removeSet: (workoutId, exerciseId, setId) =>
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
        })),

      updateQuestionnaire: (patch) =>
        set((s) => ({ questionnaire: { ...s.questionnaire, ...patch } })),

      resetQuestionnaire: () => set({ questionnaire: {} }),
    }),
    {
      name: 'fittracker-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
