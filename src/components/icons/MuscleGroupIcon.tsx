interface Props {
  group: string;
  size?: number;
}

export function MuscleGroupIcon({ group, size = 20 }: Props) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 20 20',
    fill: 'none',
  };

  switch (group) {
    case 'Грудь':
      return (
        <svg {...props}>
          {/* Two pectoral arches */}
          <path d="M3 15 Q6 8 10 11 Q14 8 17 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 9 Q8.5 7 10 7 Q11.5 7 13 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'Спина':
      return (
        <svg {...props}>
          {/* Spine */}
          <line x1="10" y1="3" x2="10" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          {/* Shoulder blades */}
          <path d="M4 7 Q7 5 10 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16 7 Q13 5 10 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          {/* Lower back */}
          <path d="M4 12 Q7 10 10 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16 12 Q13 10 10 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case 'Ноги':
      return (
        <svg {...props}>
          {/* Hip line */}
          <path d="M5 3 L15 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          {/* Left leg with knee bend */}
          <path d="M6 3 C5 7 4 11 6 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          {/* Right leg with knee bend */}
          <path d="M14 3 C15 7 16 11 14 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case 'Плечи':
      return (
        <svg {...props}>
          {/* Shoulder arc (deltoid curve) */}
          <path d="M2 14 Q5 5 10 8 Q15 5 18 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          {/* Arms hanging down */}
          <path d="M4 14 L4 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16 14 L16 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case 'Руки':
      return (
        <svg {...props}>
          {/* Arm outline */}
          <path d="M4 17 L4 11 Q3 5 10 4 Q17 5 16 11 L16 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          {/* Bicep peak */}
          <path d="M4 11 Q4 7.5 10 7.5 Q16 7.5 16 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case 'Пресс':
      return (
        <svg {...props}>
          {/* Abs grid outline */}
          <rect x="5.5" y="3" width="9" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
          {/* Center vertical divider */}
          <line x1="10" y1="3" x2="10" y2="17" stroke="currentColor" strokeWidth="1.2" />
          {/* Horizontal dividers */}
          <line x1="5.5" y1="7.7" x2="14.5" y2="7.7" stroke="currentColor" strokeWidth="1.2" />
          <line x1="5.5" y1="12.3" x2="14.5" y2="12.3" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );

    case 'Кардио':
      return (
        <svg {...props}>
          {/* Heart shape */}
          <path
            d="M10 16 L4 10 C2 7 3 4 6 4 C7.5 4 9 5.5 10 7 C11 5.5 12.5 4 14 4 C17 4 18 7 16 10 Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    default:
      return (
        <svg {...props}>
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
  }
}
