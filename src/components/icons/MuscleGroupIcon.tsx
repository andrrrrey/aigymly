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
          {/* Head */}
          <ellipse cx="20" cy="6.5" rx="5" ry="5.5" fill={BODY} />
          {/* Neck */}
          <rect x="17.5" y="11.5" width="5" height="3" rx="1" fill={BODY} />
          {/* Left arm */}
          <path d="M8 17 C6 19 5 25 6 32" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          {/* Right arm */}
          <path d="M32 17 C34 19 35 25 34 32" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          {/* Torso */}
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
          {/* Left arm */}
          <path d="M8 17 C6 19 5 25 6 32" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          {/* Right arm */}
          <path d="M32 17 C34 19 35 25 34 32" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          {/* Torso */}
          <path d="M8 17 C8 26 9 34 12 41 L28 41 C31 34 32 26 32 17 L29.5 15 Q25 13 22.5 14 L17.5 14 Q15 13 10.5 15 Z" fill={BODY} />
          {/* Spine */}
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
          {/* Hips */}
          <path d="M8 6 Q20 4 32 6 Q34 11 32 15 Q20 17 8 15 Q6 11 8 6 Z" fill={BODY} />
          {/* Left leg */}
          <path d="M9 15 C8 24 8 34 10 46 L18 46 C19 34 19 24 18 15 Z" fill={BODY} />
          {/* Right leg */}
          <path d="M22 15 C21 24 21 34 22 46 L30 46 C32 34 32 24 31 15 Z" fill={BODY} />
          {/* Left quad */}
          <path d="M9.5 16 Q13.5 14 17.5 16 L17 31 Q13.5 32.5 10 31 Z" fill={MUSCLE} />
          {/* Right quad */}
          <path d="M22.5 16 Q26.5 14 30.5 16 L30 31 Q26.5 32.5 23 31 Z" fill={MUSCLE} />
          {/* Knee lines */}
          <path d="M10 31 Q13.5 32.5 17 31" stroke="#A8B8C2" strokeWidth="0.8" fill="none" />
          <path d="M23 31 Q26.5 32.5 30 31" stroke="#A8B8C2" strokeWidth="0.8" fill="none" />
        </svg>
      );

    /* ── Плечи (Shoulders) ─────────────────────── */
    case 'Плечи':
      return (
        <svg {...svg}>
          <ellipse cx="20" cy="6.5" rx="5" ry="5.5" fill={BODY} />
          <rect x="17.5" y="11.5" width="5" height="3" rx="1" fill={BODY} />
          {/* Torso */}
          <path d="M13 19 C12 27 13 34 15 41 L25 41 C27 34 28 27 27 19 L24.5 16 Q20 15 15.5 16 Z" fill={BODY} />
          {/* Left arm */}
          <path d="M9 20 C7 23 7 31 8 39" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          {/* Right arm */}
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
          {/* Torso (partial, right side) */}
          <path d="M18 12 C15 15 15 22 16 30 L16 44" stroke={BODY} strokeWidth="8" strokeLinecap="round" />
          {/* Upper arm outer path */}
          <path d="M16 18 C13 15 9 14 8 19 C7 25 9 32 13 33 L16 28" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          {/* Forearm */}
          <path d="M13 33 C12 38 12 43 13 48" stroke={BODY} strokeWidth="4.5" strokeLinecap="round" />
          {/* Bicep highlight */}
          <path d="M15 18 Q10.5 15.5 8.5 19.5 C8 25 10 31.5 14 32.5 Q16 29.5 16 23 Z" fill={MUSCLE} />
        </svg>
      );

    /* ── Пресс (Core) ──────────────────────────── */
    case 'Пресс':
      return (
        <svg {...svg}>
          <ellipse cx="20" cy="6.5" rx="5" ry="5.5" fill={BODY} />
          <rect x="17.5" y="11.5" width="5" height="3" rx="1" fill={BODY} />
          {/* Left arm */}
          <path d="M8 17 C6 19 5 25 6 32" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          {/* Right arm */}
          <path d="M32 17 C34 19 35 25 34 32" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          {/* Torso */}
          <path d="M8 17 C8 28 9 37 13 45 L27 45 C31 37 32 28 32 17 L29.5 15 Q25 13 22.5 14 L17.5 14 Q15 13 10.5 15 Z" fill={BODY} />
          {/* Abs grid – 3 rows × 2 columns */}
          <rect x="11.5" y="19" width="7" height="5.5" rx="1.5" fill={MUSCLE} />
          <rect x="21.5" y="19" width="7" height="5.5" rx="1.5" fill={MUSCLE} />
          <rect x="11.5" y="26.5" width="7" height="5.5" rx="1.5" fill={MUSCLE} />
          <rect x="21.5" y="26.5" width="7" height="5.5" rx="1.5" fill={MUSCLE} />
          <rect x="11.5" y="34" width="7" height="5.5" rx="1.5" fill={MUSCLE} />
          <rect x="21.5" y="34" width="7" height="5.5" rx="1.5" fill={MUSCLE} />
        </svg>
      );

    /* ── Кардио (Cardio) ───────────────────────── */
    case 'Кардио':
      return (
        <svg {...svg}>
          {/* Running figure */}
          <ellipse cx="26" cy="6.5" rx="4.5" ry="5" fill={BODY} />
          {/* Torso leaning forward */}
          <path d="M22 12 C19 16 16 19 15 23 L17 30" stroke={BODY} strokeWidth="5.5" strokeLinecap="round" />
          {/* Arm reaching back */}
          <path d="M19 19 C23 21 27 23 30 25" stroke={BODY} strokeWidth="3.5" strokeLinecap="round" />
          {/* Arm reaching forward-up */}
          <path d="M18 17 C15 14 11 12 8 9" stroke={BODY} strokeWidth="3.5" strokeLinecap="round" />
          {/* Leg forward */}
          <path d="M17 30 C15 35 13 39 11 44 L8 47" stroke={BODY} strokeWidth="4" strokeLinecap="round" />
          {/* Leg back */}
          <path d="M17 30 C20 35 24 38 28 40 L32 42" stroke={BODY} strokeWidth="4" strokeLinecap="round" />
          {/* Heart */}
          <path d="M4 31 C4 27 9.5 25 11.5 29.5 C13.5 25 19 27 19 31 C19 36 11.5 41 11.5 41 C11.5 41 4 36 4 31 Z" fill={MUSCLE} />
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
