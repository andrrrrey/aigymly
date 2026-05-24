export type MarkerColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'cyan'
  | 'blue'
  | 'purple'
  | 'gray';

export type WorkoutEmoji = 'wink' | 'sleepy' | 'happy' | 'cool' | 'flex' | 'fire';

export type ExerciseKind = 'strength' | 'cardio';

export interface Exercise {
  id: string;
  name: string;
  kind: ExerciseKind;
  muscleGroup: string;
  // For strength
  sets?: ExerciseSet[];
  // For cardio
  durationSec?: number;
  distanceM?: number;
}

export interface ExerciseSet {
  id: string;
  reps: number;
  weightKg: number;
  done?: boolean;
}

export interface Workout {
  id: string;
  title: string;
  date: string; // ISO date (yyyy-MM-dd)
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  emoji: WorkoutEmoji;
  emojiBg: MarkerColor;
  marker: MarkerColor;
  exercises: Exercise[];
  notes?: string;
  notifyMinutesBefore?: number;
  completed?: boolean;
}

// AI questionnaire
export type FitnessGoal =
  | 'lose_weight'
  | 'gain_muscle'
  | 'maintain'
  | 'endurance'
  | 'mobility'
  | 'rehab';

export type Experience = 'beginner' | 'intermediate' | 'advanced';
export type Location = 'gym' | 'home' | 'outdoor' | 'mixed';
export type Equipment =
  | 'barbell'
  | 'dumbbells'
  | 'machines'
  | 'bands'
  | 'pullup_bar'
  | 'bodyweight_only'
  | 'cardio_machines';

export interface QuestionnaireAnswers {
  goal?: FitnessGoal;
  experience?: Experience;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  sex?: 'male' | 'female' | 'other';
  sessionsPerWeek?: number;
  sessionDurationMin?: 30 | 45 | 60 | 90;
  location?: Location;
  equipment?: Equipment[];
  injuries?: string;
  priorityMuscles?: string[];
  preferredDays?: number[]; // 0-6, Mon=0
  preferredTime?: string; // "HH:mm"
  notes?: string;
}
