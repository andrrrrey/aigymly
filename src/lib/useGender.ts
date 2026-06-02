'use client';

import { useAuth } from '@/store/auth';
import { useApp } from '@/store/app';

export type Gender = 'male' | 'female';

/**
 * Resolves the gender used to pick category icons.
 * Prefers the logged-in user's saved sex, then the questionnaire answer,
 * and defaults to 'male' (questionnaire 'other' maps to 'male').
 */
export function useGender(): Gender {
  const userSex = useAuth((s) => s.user?.sex);
  const questionnaireSex = useApp((s) => s.questionnaire.sex);
  const value = userSex ?? questionnaireSex;
  return value === 'female' ? 'female' : 'male';
}
