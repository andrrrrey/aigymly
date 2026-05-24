import type { Exercise } from '@/types';

export interface ExerciseTemplate {
  id: string;
  name: string;
  nameRu: string;
  kind: 'strength' | 'cardio';
  muscleGroup: string;
  muscleGroupRu: string;
}

export const EXERCISE_LIBRARY: ExerciseTemplate[] = [
  // Chest
  { id: 'bench-press', name: 'Bench Press', nameRu: 'Жим лёжа', kind: 'strength', muscleGroup: 'Chest', muscleGroupRu: 'Грудь' },
  { id: 'incline-bench', name: 'Incline Bench Press', nameRu: 'Жим на наклонной', kind: 'strength', muscleGroup: 'Chest', muscleGroupRu: 'Грудь' },
  { id: 'dumbbell-press', name: 'Dumbbell Press', nameRu: 'Жим гантелей', kind: 'strength', muscleGroup: 'Chest', muscleGroupRu: 'Грудь' },
  { id: 'pushup', name: 'Push-up', nameRu: 'Отжимания', kind: 'strength', muscleGroup: 'Chest', muscleGroupRu: 'Грудь' },
  { id: 'cable-fly', name: 'Cable Fly', nameRu: 'Сведения в кроссовере', kind: 'strength', muscleGroup: 'Chest', muscleGroupRu: 'Грудь' },

  // Back
  { id: 'pullup', name: 'Pull-up', nameRu: 'Подтягивания', kind: 'strength', muscleGroup: 'Back', muscleGroupRu: 'Спина' },
  { id: 'deadlift', name: 'Deadlift', nameRu: 'Становая тяга', kind: 'strength', muscleGroup: 'Back', muscleGroupRu: 'Спина' },
  { id: 'barbell-row', name: 'Barbell Row', nameRu: 'Тяга штанги в наклоне', kind: 'strength', muscleGroup: 'Back', muscleGroupRu: 'Спина' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', nameRu: 'Тяга верхнего блока', kind: 'strength', muscleGroup: 'Back', muscleGroupRu: 'Спина' },
  { id: 'seated-row', name: 'Seated Cable Row', nameRu: 'Тяга горизонтального блока', kind: 'strength', muscleGroup: 'Back', muscleGroupRu: 'Спина' },

  // Legs
  { id: 'squat', name: 'Back Squat', nameRu: 'Приседания со штангой', kind: 'strength', muscleGroup: 'Legs', muscleGroupRu: 'Ноги' },
  { id: 'front-squat', name: 'Front Squat', nameRu: 'Фронтальные приседания', kind: 'strength', muscleGroup: 'Legs', muscleGroupRu: 'Ноги' },
  { id: 'leg-press', name: 'Leg Press', nameRu: 'Жим ногами', kind: 'strength', muscleGroup: 'Legs', muscleGroupRu: 'Ноги' },
  { id: 'lunges', name: 'Lunges', nameRu: 'Выпады', kind: 'strength', muscleGroup: 'Legs', muscleGroupRu: 'Ноги' },
  { id: 'leg-curl', name: 'Leg Curl', nameRu: 'Сгибания ног', kind: 'strength', muscleGroup: 'Legs', muscleGroupRu: 'Ноги' },
  { id: 'leg-extension', name: 'Leg Extension', nameRu: 'Разгибания ног', kind: 'strength', muscleGroup: 'Legs', muscleGroupRu: 'Ноги' },
  { id: 'romanian-dl', name: 'Romanian Deadlift', nameRu: 'Румынская тяга', kind: 'strength', muscleGroup: 'Legs', muscleGroupRu: 'Ноги' },
  { id: 'calf-raise', name: 'Calf Raise', nameRu: 'Подъём на носки', kind: 'strength', muscleGroup: 'Legs', muscleGroupRu: 'Ноги' },

  // Shoulders
  { id: 'ohp', name: 'Overhead Press', nameRu: 'Жим стоя', kind: 'strength', muscleGroup: 'Shoulders', muscleGroupRu: 'Плечи' },
  { id: 'lateral-raise', name: 'Lateral Raise', nameRu: 'Махи в стороны', kind: 'strength', muscleGroup: 'Shoulders', muscleGroupRu: 'Плечи' },
  { id: 'front-raise', name: 'Front Raise', nameRu: 'Подъёмы перед собой', kind: 'strength', muscleGroup: 'Shoulders', muscleGroupRu: 'Плечи' },
  { id: 'face-pull', name: 'Face Pull', nameRu: 'Тяга к лицу', kind: 'strength', muscleGroup: 'Shoulders', muscleGroupRu: 'Плечи' },

  // Arms
  { id: 'barbell-curl', name: 'Barbell Curl', nameRu: 'Подъём штанги на бицепс', kind: 'strength', muscleGroup: 'Arms', muscleGroupRu: 'Руки' },
  { id: 'hammer-curl', name: 'Hammer Curl', nameRu: 'Молотки', kind: 'strength', muscleGroup: 'Arms', muscleGroupRu: 'Руки' },
  { id: 'tricep-extension', name: 'Tricep Extension', nameRu: 'Разгибания на трицепс', kind: 'strength', muscleGroup: 'Arms', muscleGroupRu: 'Руки' },
  { id: 'dips', name: 'Dips', nameRu: 'Брусья', kind: 'strength', muscleGroup: 'Arms', muscleGroupRu: 'Руки' },

  // Core
  { id: 'plank', name: 'Plank', nameRu: 'Планка', kind: 'strength', muscleGroup: 'Core', muscleGroupRu: 'Пресс' },
  { id: 'crunches', name: 'Crunches', nameRu: 'Скручивания', kind: 'strength', muscleGroup: 'Core', muscleGroupRu: 'Пресс' },
  { id: 'leg-raise', name: 'Hanging Leg Raise', nameRu: 'Подъём ног в висе', kind: 'strength', muscleGroup: 'Core', muscleGroupRu: 'Пресс' },
  { id: 'russian-twist', name: 'Russian Twist', nameRu: 'Русский твист', kind: 'strength', muscleGroup: 'Core', muscleGroupRu: 'Пресс' },

  // Cardio
  { id: 'running', name: 'Running', nameRu: 'Бег', kind: 'cardio', muscleGroup: 'Cardio', muscleGroupRu: 'Кардио' },
  { id: 'cycling', name: 'Cycling', nameRu: 'Велосипед', kind: 'cardio', muscleGroup: 'Cardio', muscleGroupRu: 'Кардио' },
  { id: 'rowing', name: 'Rowing Machine', nameRu: 'Гребной тренажёр', kind: 'cardio', muscleGroup: 'Cardio', muscleGroupRu: 'Кардио' },
  { id: 'elliptical', name: 'Elliptical', nameRu: 'Эллипс', kind: 'cardio', muscleGroup: 'Cardio', muscleGroupRu: 'Кардио' },
  { id: 'jumping-rope', name: 'Jumping Rope', nameRu: 'Скакалка', kind: 'cardio', muscleGroup: 'Cardio', muscleGroupRu: 'Кардио' },
  { id: 'swimming', name: 'Swimming', nameRu: 'Плавание', kind: 'cardio', muscleGroup: 'Cardio', muscleGroupRu: 'Кардио' },
  { id: 'walking', name: 'Walking', nameRu: 'Ходьба', kind: 'cardio', muscleGroup: 'Cardio', muscleGroupRu: 'Кардио' },
];

export const MUSCLE_GROUPS_RU = ['Грудь', 'Спина', 'Ноги', 'Плечи', 'Руки', 'Пресс', 'Кардио'];

export function createExerciseFromTemplate(template: ExerciseTemplate): Exercise {
  return {
    id: `${template.id}-${Date.now()}`,
    name: template.nameRu,
    kind: template.kind,
    muscleGroup: template.muscleGroupRu,
    ...(template.kind === 'strength'
      ? { sets: [{ id: `set-${Date.now()}`, reps: 10, weightKg: 0 }] }
      : { durationSec: 600 }),
  };
}
