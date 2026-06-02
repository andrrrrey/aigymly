import type { Gender } from '@/lib/useGender';

interface Props {
  group: string;
  gender: Gender;
  size?: number;
}

// Maps a Russian muscle-group name to its icon file name (shared between
// /img/man and /img/woman). The "Все" category uses the gendered all-* icon.
const GROUP_FILE: Record<string, string> = {
  Грудь: 'chest',
  Спина: 'back',
  Ноги: 'legs',
  Ягодицы: 'buttocks',
  Плечи: 'shoulders',
  Руки: 'hands',
  Пресс: 'press',
  Кардио: 'cardio',
  Медитация: 'meditation',
  Релакс: 'relax',
};

export function MuscleGroupIcon({ group, gender, size = 28 }: Props) {
  const folder = gender === 'female' ? 'woman' : 'man';
  const file = group === 'Все' ? `all-${folder}` : GROUP_FILE[group];
  if (!file) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/img/${folder}/${file}.png`}
      alt={group}
      width={size}
      height={size}
      className="object-contain"
      style={{ width: size, height: size }}
    />
  );
}
