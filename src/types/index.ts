export type MarkerColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'cyan'
  | 'blue'
  | 'purple'
  | 'gray';

export type WorkoutEmoji = 'wink' | 'sleepy' | 'happy' | 'cool' | 'flex' | 'fire' | 'neutral';

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
  icon?: string; // default workout icon shown until the workout is rated
  exercises: Exercise[];
  notes?: string;
  notifyMinutesBefore?: number;
  completed?: boolean;
  userEmail?: string;
}

// AI questionnaire
export type Sex = 'male' | 'female';

export type FitnessGoal =
  | 'lose_weight' // Похудение
  | 'gain_muscle' // Набор мышечной массы
  | 'tone' // Тонус и рельеф
  | 'strength_endurance' // Сила и выносливость
  | 'rehab' // Реабилитация и ЛФК
  | 'functional' // Функциональная подготовка
  | 'general_health'; // Общее здоровье и самочувствие

export type Experience =
  | 'never' // Никогда не тренировался
  | 'beginner' // Новичок (менее 6 месяцев)
  | 'intermediate' // Средний (6–18 месяцев)
  | 'advanced'; // Продвинутый (более 1.5 лет)

export type WorkoutPlace = 'home' | 'outdoor' | 'gym';

export type Equipment =
  | 'none_mat' // Ничего, только коврик
  | 'dumbbells' // Гантели
  | 'barbell' // Штанга и блины
  | 'bands' // Резиновые петли, эспандеры
  | 'pullup_bar' // Турник
  | 'parallel_bars' // Брусья
  | 'kettlebell' // Гиря
  | 'fitball' // Фитбол
  | 'jump_rope' // Скакалка
  | 'treadmill' // Беговая дорожка
  | 'bike' // Велотренажёр
  | 'elliptical' // Эллиптический тренажёр
  | 'step' // Степ-платформа
  | 'full_gym'; // Полный зал

// Female physiology
export type Pregnancy = 'no' | 'yes';
export type MenstrualPhase =
  | 'skip' // Не хочу указывать
  | 'not_tracking' // Не отслеживаю
  | 'menstruation' // Менструация (1–5 день)
  | 'follicular' // Фолликулярная фаза (6–14 день)
  | 'ovulation' // Овуляция (около 14 дня)
  | 'luteal'; // Лютеиновая фаза (15–28 день)
export type BodyShape = 'pear' | 'apple' | 'rectangle' | 'hourglass';

// Lifestyle
export type Occupation = 'sedentary' | 'on_feet' | 'physical' | 'mixed';
export type Sleep = 'lt6' | '6to7' | '7to8' | 'gt8';
export type Nutrition = 'not_tracking' | 'intuitive' | 'counting' | 'specific';

// AI-generated training program
export interface ProgramDay {
  id: string;
  title: string; // "День 1 — Грудь и трицепс"
  focus?: string; // muscle focus
  weekday?: number; // 0-6, Mon=0 — recommended day
  exercises: Exercise[];
  notes?: string;
}

// A 4-week mesocycle block (Block 1: weeks 1–4, Block 2: weeks 5–8)
export interface ProgramBlock {
  name: string; // "Блок 1 — Адаптация"
  weeks: string; // "Недели 1–4"
  days: ProgramDay[];
}

// Rich textual analysis shown as sections on the program page
export interface ProgramAnalysis {
  profile: string; // Анализ профиля (ИМТ, тип телосложения, уровень, риск)
  strategy: string; // Стратегия под цели
  recommendations: string; // Питание, вода, сон, особые указания
}

export interface Program {
  id: string;
  title: string;
  description?: string;
  goal?: FitnessGoal;
  days: ProgramDay[]; // kept = blocks[0].days for back-compat
  blocks?: ProgramBlock[];
  analysis?: ProgramAnalysis;
  weeksTotal?: number; // 8
  createdAt?: string;
}

export interface QuestionnaireAnswers {
  // Блок 1. Базовый профиль
  sex?: Sex;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  // Блок 2. Цель
  goals?: FitnessGoal[];
  // Блок 3. Здоровье и ограничения
  chronicConditions?: string;
  pastInjuries?: string;
  currentComplaints?: string;
  medicalRestrictions?: string;
  // Блок 4. Контекст тренировок
  place?: WorkoutPlace;
  equipment?: Equipment[];
  sessionsPerWeek?: number; // 1-7
  experience?: Experience;
  sessionDurationMin?: number; // 20/30/45/60/90/120
  // Блок 5. Женская физиология (only when sex === 'female')
  pregnancy?: Pregnancy;
  pregnancyWeeks?: number;
  menstrualPhase?: MenstrualPhase;
  menopause?: 'yes' | 'no';
  painfulPeriods?: 'yes' | 'no';
  bodyShape?: BodyShape;
  // Блок 6. Образ жизни и восстановление (опционально)
  occupation?: Occupation;
  sleep?: Sleep;
  nutrition?: Nutrition;
  nutritionDiet?: string;
  // Scheduling preferences
  preferredDays?: number[]; // 0-6, Mon=0
  preferredTime?: string; // "HH:mm"
  notes?: string;
}
