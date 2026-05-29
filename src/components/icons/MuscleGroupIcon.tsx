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
          {/* Side view of hip/lower body */}
          {/* Lower back / spine curve */}
          <path d="M24 4 C24 8 25 13 23 19" stroke={BODY} strokeWidth="2" strokeLinecap="round" />
          {/* Hip crest */}
          <path d="M23 19 Q29 22 28 30" stroke={BODY} strokeWidth="2" strokeLinecap="round" />
          {/* Under-glute / thigh transition */}
          <path d="M28 30 Q26 38 22 42" stroke={BODY} strokeWidth="2" strokeLinecap="round" />
          {/* Front body line (hip flexor side) */}
          <path d="M23 19 Q17 21 17 30 Q17 37 19 42" stroke={BODY} strokeWidth="2" strokeLinecap="round" />
          {/* Waist indent */}
          <path d="M24 13 Q21 16 23 19" stroke={BODY} strokeWidth="1.5" strokeLinecap="round" />
          {/* Glute muscle — large orange teardrop */}
          <path d="M23 20 Q31 24 30 34 Q28 41 22 42 Q16 41 17 33 Q17 24 23 20 Z" fill={MUSCLE} />
          {/* Leg continuing down */}
          <path d="M20 42 L19 52" stroke={BODY} strokeWidth="6" strokeLinecap="round" />
          <path d="M24 44 L23 52" stroke={BODY} strokeWidth="4.5" strokeLinecap="round" />
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

    /* ── Кардио (Cardio) — chest with anatomical heart ── */
    case 'Кардио':
      return (
        <svg {...svg}>
          {/* Same torso as chest icon */}
          <ellipse cx="20" cy="6.5" rx="5" ry="5.5" fill={BODY} />
          <rect x="17.5" y="11.5" width="5" height="3" rx="1" fill={BODY} />
          <path d="M8 17 C6 19 5 25 6 32" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          <path d="M32 17 C34 19 35 25 34 32" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          <path d="M8 17 C8 26 9 34 12 41 L28 41 C31 34 32 26 32 17 L29.5 15 Q25 13 22.5 14 L17.5 14 Q15 13 10.5 15 Z" fill={BODY} />
          {/* Anatomical heart on left chest */}
          {/* Aorta / top vessels */}
          <path d="M16 18 C15.5 15.5 15 14 16 13" stroke={MUSCLE} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M19 18.5 C19.5 16 19.5 14.5 19 13.5" stroke={MUSCLE} strokeWidth="1.4" strokeLinecap="round" />
          {/* Main heart body — two-lobe shape */}
          <path
            d="M11.5 22.5 C11 19 12.5 17 14.5 17.5 C15.5 17.8 16.5 18.8 17 20
               C17 18.8 18 17.8 19.5 17.5 C21.5 17 23 19 22.5 22.5
               C22 26.5 17 31 17 31
               C17 31 11.5 26.5 11.5 22.5 Z"
            fill={MUSCLE}
          />
          {/* Inner highlight for depth */}
          <path d="M15 23 Q14 22 13.5 23.5" stroke="#E06010" strokeWidth="0.9" strokeLinecap="round" />
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
          {/* Torso — orange (whole body highlighted like a top) */}
          <path
            d="M13.5 14 C12 20 12 26 13 31 L27 31 C28 26 28 20 26.5 14 Q23 13 20 13 Q17 13 13.5 14 Z"
            fill={MUSCLE}
          />
          {/* Left arm resting on left knee */}
          <path d="M13 18 C10.5 22 9 27 8 33" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          {/* Right arm */}
          <path d="M27 18 C29.5 22 31 27 32 33" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          {/* Left shin crossing to the right (lotus) */}
          <path d="M14 31 C15 36 18 40 23 43" stroke={BODY} strokeWidth="6" strokeLinecap="round" />
          {/* Right shin crossing to the left (lotus) */}
          <path d="M26 31 C25 36 22 40 17 43" stroke={BODY} strokeWidth="6" strokeLinecap="round" />
          {/* Left foot (visible on right) */}
          <ellipse cx="25" cy="44" rx="5" ry="3" fill={BODY} />
          {/* Right foot (visible on left) */}
          <ellipse cx="15" cy="44" rx="5" ry="3" fill={BODY} />
        </svg>
      );

    /* ── Релакс (Relax) — back + massage hands ─── */
    case 'Релакс':
      return (
        <svg {...svg}>
          {/* Back view of body (lying / standing) */}
          <ellipse cx="20" cy="6.5" rx="5" ry="5.5" fill={BODY} />
          <rect x="17.5" y="11.5" width="5" height="3" rx="1" fill={BODY} />
          <path d="M8 17 C6 19 5 25 6 32" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          <path d="M32 17 C34 19 35 25 34 32" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
          <path d="M8 17 C8 26 9 34 12 41 L28 41 C31 34 32 26 32 17 L29.5 15 Q25 13 22.5 14 L17.5 14 Q15 13 10.5 15 Z" fill={BODY} />
          <line x1="20" y1="14" x2="20" y2="41" stroke="#A8B8C2" strokeWidth="1" />
          {/* Lower back / lumbar area — orange */}
          <path d="M11 28 Q20 26 29 28 L29 37 Q20 39 11 37 Z" fill={MUSCLE} />
          {/* Massage hands — two pairs pressing into lower back */}
          {/* Left pair */}
          <path d="M13 24 L12.5 29" stroke="#8FA0AC" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M16 23 L15.5 28" stroke="#8FA0AC" strokeWidth="3.5" strokeLinecap="round" />
          {/* Right pair */}
          <path d="M24 23 L24.5 28" stroke="#8FA0AC" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M27 24 L27.5 29" stroke="#8FA0AC" strokeWidth="3.5" strokeLinecap="round" />
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
