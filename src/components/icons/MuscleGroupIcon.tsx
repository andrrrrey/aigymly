interface Props {
  group: string;
  size?: number;
}

const BODY = '#BCC4CC';
const MUSCLE = '#FF9028';

export function MuscleGroupIcon({ group, size = 28 }: Props) {
  const svg = {
    width: size,
    height: size,
    viewBox: '0 0 40 52',
    fill: 'none',
  };

  switch (group) {
    /* ── Грудь (Chest) ─────────────────────────── */
    case 'Грудь':
      return (
        <svg {...svg}>
          <ellipse cx="20" cy="6.5" rx="5" ry="5.5" fill={BODY} />
          <rect x="17.5" y="11.5" width="5" height="3" rx="1" fill={BODY} />
          <path d="M8 17 C6 19 5 25 6 32" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          <path d="M32 17 C34 19 35 25 34 32" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          <path d="M8 17 C8 26 9 34 12 41 L28 41 C31 34 32 26 32 17 L29.5 15 Q25 13 22.5 14 L17.5 14 Q15 13 10.5 15 Z" fill={BODY} />
          {/* Left pec */}
          <path d="M8.5 18 Q12 14.5 20.5 17 Q21 26 15.5 28.5 Q9.5 26.5 8.5 18 Z" fill={MUSCLE} />
          {/* Right pec */}
          <path d="M31.5 18 Q28 14.5 19.5 17 Q19 26 24.5 28.5 Q30.5 26.5 31.5 18 Z" fill={MUSCLE} />
        </svg>
      );

    /* ── Спина (Back) ──────────────────────────── */
    case 'Спина':
      return (
        <svg {...svg}>
          <ellipse cx="20" cy="6.5" rx="5" ry="5.5" fill={BODY} />
          <rect x="17.5" y="11.5" width="5" height="3" rx="1" fill={BODY} />
          <path d="M8 17 C6 19 5 25 6 32" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          <path d="M32 17 C34 19 35 25 34 32" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          <path d="M8 17 C8 26 9 34 12 41 L28 41 C31 34 32 26 32 17 L29.5 15 Q25 13 22.5 14 L17.5 14 Q15 13 10.5 15 Z" fill={BODY} />
          <line x1="20" y1="14" x2="20" y2="41" stroke="#A8B8C2" strokeWidth="1" />
          {/* Left lat */}
          <path d="M8.5 18 Q11 14.5 17 17 Q15 28 13.5 33 Q8.5 28 8.5 18 Z" fill={MUSCLE} />
          {/* Right lat */}
          <path d="M31.5 18 Q29 14.5 23 17 Q25 28 26.5 33 Q31.5 28 31.5 18 Z" fill={MUSCLE} />
        </svg>
      );

    /* ── Ноги (Legs) ───────────────────────────── */
    case 'Ноги':
      return (
        <svg {...svg}>
          <path d="M8 6 Q20 4 32 6 Q34 11 32 15 Q20 17 8 15 Q6 11 8 6 Z" fill={BODY} />
          <path d="M9 15 C8 24 8 34 10 46 L18 46 C19 34 19 24 18 15 Z" fill={BODY} />
          <path d="M22 15 C21 24 21 34 22 46 L30 46 C32 34 32 24 31 15 Z" fill={BODY} />
          {/* Left quad */}
          <path d="M9.5 16 Q13.5 14 17.5 16 L17 31 Q13.5 32.5 10 31 Z" fill={MUSCLE} />
          {/* Right quad */}
          <path d="M22.5 16 Q26.5 14 30.5 16 L30 31 Q26.5 32.5 23 31 Z" fill={MUSCLE} />
          <path d="M10 31 Q13.5 32.5 17 31" stroke="#A8B8C2" strokeWidth="0.8" />
          <path d="M23 31 Q26.5 32.5 30 31" stroke="#A8B8C2" strokeWidth="0.8" />
        </svg>
      );

    /* ── Ягодицы (Glutes) ──────────────────────── */
    case 'Ягодицы':
      return (
        <svg {...svg}>
          {/* Side/rear view — zoomed on hip & glute */}
          {/* Lower back coming from top */}
          <path d="M29 4 C30 9 29.5 14 27 19" stroke={BODY} strokeWidth="2.5" strokeLinecap="round" />
          {/* Iliac crest / top of hip */}
          <path d="M27 19 C24 17 20 17 18 19" stroke={BODY} strokeWidth="2.2" strokeLinecap="round" />
          {/* Front hip / abdomen line */}
          <path d="M18 19 C15 23 15 31 17 39" stroke={BODY} strokeWidth="2.5" strokeLinecap="round" />
          {/* Under-glute / thigh fold */}
          <path d="M17 39 C19 43 24 45 29 42" stroke={BODY} strokeWidth="2.2" strokeLinecap="round" />
          {/* Back of thigh going down */}
          <path d="M29 42 C30 46 29 49 28 52" stroke={BODY} strokeWidth="2.5" strokeLinecap="round" />
          {/* Glute muscle — large prominent rounded shield */}
          <path
            d="M27 20 C35 24 36 34 33 41 C31 45 26 46 21 43 C16 40 15 31 18 25 C20 21 23 19 27 20 Z"
            fill={MUSCLE}
          />
          {/* Front leg (thigh continuing down) */}
          <path d="M17 40 L16 52" stroke={BODY} strokeWidth="6" strokeLinecap="round" />
        </svg>
      );

    /* ── Плечи (Shoulders) ─────────────────────── */
    case 'Плечи':
      return (
        <svg {...svg}>
          <ellipse cx="20" cy="6.5" rx="5" ry="5.5" fill={BODY} />
          <rect x="17.5" y="11.5" width="5" height="3" rx="1" fill={BODY} />
          <path d="M13 19 C12 27 13 34 15 41 L25 41 C27 34 28 27 27 19 L24.5 16 Q20 15 15.5 16 Z" fill={BODY} />
          <path d="M9 20 C7 23 7 31 8 39" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          <path d="M31 20 C33 23 33 31 32 39" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          {/* Left deltoid */}
          <path d="M13 15 Q9 15.5 8 21 Q10 23 12.5 20.5 Q14 18.5 17.5 15 Z" fill={MUSCLE} />
          {/* Right deltoid */}
          <path d="M27 15 Q31 15.5 32 21 Q30 23 27.5 20.5 Q26 18.5 22.5 15 Z" fill={MUSCLE} />
        </svg>
      );

    /* ── Руки (Arms) ───────────────────────────── */
    case 'Руки':
      return (
        <svg {...svg}>
          <ellipse cx="24" cy="6.5" rx="5" ry="5.5" fill={BODY} />
          <path d="M18 12 C15 15 15 22 16 30 L16 44" stroke={BODY} strokeWidth="8" strokeLinecap="round" />
          <path d="M16 18 C13 15 9 14 8 19 C7 25 9 32 13 33 L16 28" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          <path d="M13 33 C12 38 12 43 13 48" stroke={BODY} strokeWidth="4.5" strokeLinecap="round" />
          {/* Bicep */}
          <path d="M15 18 Q10.5 15.5 8.5 19.5 C8 25 10 31.5 14 32.5 Q16 29.5 16 23 Z" fill={MUSCLE} />
        </svg>
      );

    /* ── Пресс (Core) ──────────────────────────── */
    case 'Пресс':
      return (
        <svg {...svg}>
          <ellipse cx="20" cy="6.5" rx="5" ry="5.5" fill={BODY} />
          <rect x="17.5" y="11.5" width="5" height="3" rx="1" fill={BODY} />
          <path d="M8 17 C6 19 5 25 6 32" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          <path d="M32 17 C34 19 35 25 34 32" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          <path d="M8 17 C8 28 9 37 13 45 L27 45 C31 37 32 28 32 17 L29.5 15 Q25 13 22.5 14 L17.5 14 Q15 13 10.5 15 Z" fill={BODY} />
          {/* Abs 3×2 */}
          <rect x="11.5" y="19" width="7" height="5.5" rx="1.5" fill={MUSCLE} />
          <rect x="21.5" y="19" width="7" height="5.5" rx="1.5" fill={MUSCLE} />
          <rect x="11.5" y="26.5" width="7" height="5.5" rx="1.5" fill={MUSCLE} />
          <rect x="21.5" y="26.5" width="7" height="5.5" rx="1.5" fill={MUSCLE} />
          <rect x="11.5" y="34" width="7" height="5.5" rx="1.5" fill={MUSCLE} />
          <rect x="21.5" y="34" width="7" height="5.5" rx="1.5" fill={MUSCLE} />
        </svg>
      );

    /* ── Кардио (Cardio) — chest with anatomical heart on RIGHT ── */
    case 'Кардио':
      return (
        <svg {...svg}>
          <ellipse cx="20" cy="6.5" rx="5" ry="5.5" fill={BODY} />
          <rect x="17.5" y="11.5" width="5" height="3" rx="1" fill={BODY} />
          <path d="M8 17 C6 19 5 25 6 32" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          <path d="M32 17 C34 19 35 25 34 32" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          <path d="M8 17 C8 26 9 34 12 41 L28 41 C31 34 32 26 32 17 L29.5 15 Q25 13 22.5 14 L17.5 14 Q15 13 10.5 15 Z" fill={BODY} />
          {/* Aorta vessels — right side of chest (viewer's right = heart's anatomical side) */}
          <path d="M22 18 C21.5 15.5 21 14 22 13" stroke={MUSCLE} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M25.5 18.5 C26 16 26 14.5 25.5 13.5" stroke={MUSCLE} strokeWidth="1.4" strokeLinecap="round" />
          {/* Heart body — two-lobe anatomical shape */}
          <path
            d="M17.5 22.5 C17 19 18.5 17 20.5 17.5 C21.5 17.8 22.5 18.8 23 20
               C23 18.8 24 17.8 25.5 17.5 C27.5 17 29 19 28.5 22.5
               C28 26.5 23 31 23 31
               C23 31 17.5 26.5 17.5 22.5 Z"
            fill={MUSCLE}
          />
          <path d="M21 23 Q20 22 19.5 23.5" stroke="#D45500" strokeWidth="0.9" strokeLinecap="round" />
        </svg>
      );

    /* ── Медитация (Meditation) — lotus pose ───── */
    case 'Медитация':
      return (
        <svg {...svg}>
          {/* Head */}
          <ellipse cx="20" cy="5.5" rx="5.5" ry="6" fill={BODY} />
          {/* Neck */}
          <rect x="17.5" y="11" width="5" height="3" rx="1" fill={BODY} />
          {/* Torso — orange */}
          <path
            d="M13.5 14 C12 20 12 26 13 31 L27 31 C28 26 28 20 26.5 14 Q23 13 20 13 Q17 13 13.5 14 Z"
            fill={MUSCLE}
          />
          {/* Left arm down to left knee */}
          <path d="M13 18 C10.5 21 8.5 25 7 30" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          {/* Right arm down to right knee */}
          <path d="M27 18 C29.5 21 31.5 25 33 30" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          {/* Wide thigh base — left thigh going out to the left */}
          <path d="M14 31 C11 32 8 33 6 34" stroke={BODY} strokeWidth="5.5" strokeLinecap="round" />
          {/* Wide thigh base — right thigh going out to the right */}
          <path d="M26 31 C29 32 32 33 34 34" stroke={BODY} strokeWidth="5.5" strokeLinecap="round" />
          {/* Left shin: crosses from left knee → right center */}
          <path d="M6 34 C9 38 14 41 20 43" stroke={BODY} strokeWidth="5.5" strokeLinecap="round" />
          {/* Right shin: crosses from right knee → left center (drawn on top) */}
          <path d="M34 34 C31 38 26 41 20 43" stroke={BODY} strokeWidth="5.5" strokeLinecap="round" />
          {/* Left foot (on right side, under right shin) */}
          <ellipse cx="22" cy="44.5" rx="5" ry="3" fill={BODY} />
          {/* Right foot (on left side, under left shin) */}
          <ellipse cx="18" cy="44.5" rx="5" ry="3" fill={BODY} />
        </svg>
      );

    /* ── Релакс (Relax) — person lying prone + massage hands ── */
    case 'Релакс':
      return (
        <svg {...svg}>
          {/* Massage hands descending from above */}
          {/* Left wrist/forearm */}
          <path d="M11 5 L10 21" stroke="#9AAAB5" strokeWidth="5" strokeLinecap="round" />
          <path d="M16 4 L15 20" stroke="#9AAAB5" strokeWidth="4.5" strokeLinecap="round" />
          {/* Fingers spread at bottom of hands */}
          <path d="M9.5 21 L9 25" stroke="#9AAAB5" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M12 21 L11.5 25" stroke="#9AAAB5" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M15.5 21 L15.5 25" stroke="#9AAAB5" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M18 21 L18.5 25" stroke="#9AAAB5" strokeWidth="2.3" strokeLinecap="round" />

          {/* Person lying face down */}
          {/* Head (side profile) on the right */}
          <ellipse cx="31" cy="34" rx="6" ry="7" fill={BODY} />
          {/* Ear detail */}
          <path d="M25.5 32 C24.5 34 25 36 26 36" stroke="#A8B8C2" strokeWidth="1.2" fill="none" />
          {/* Neck connecting to torso */}
          <path d="M25 33 L22 34" stroke={BODY} strokeWidth="4" strokeLinecap="round" />
          {/* Torso (horizontal, going left) */}
          <rect x="5" y="28" width="18" height="12" rx="3" fill={BODY} />
          {/* Legs going off to the left */}
          <path d="M6 28 L2 26" stroke={BODY} strokeWidth="5.5" strokeLinecap="round" />
          <path d="M6 40 L2 42" stroke={BODY} strokeWidth="5.5" strokeLinecap="round" />
          {/* Orange lower back / lumbar area */}
          <rect x="5.5" y="28.5" width="8.5" height="11" rx="2" fill={MUSCLE} />
        </svg>
      );

    default:
      return (
        <svg {...svg}>
          <circle cx="20" cy="26" r="10" fill={BODY} />
        </svg>
      );
  }
}
