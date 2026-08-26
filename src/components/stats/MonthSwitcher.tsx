'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatMonthTitle, type MonthKey } from '@/lib/statsMonth';

// «‹ Август 2026 ›». The label is tappable when `onOpenCalendar` is given.
export function MonthSwitcher({
  monthKey,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onOpenCalendar,
  size = 'md',
}: {
  monthKey: MonthKey;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onOpenCalendar?: () => void;
  size?: 'md' | 'lg';
}) {
  const title = formatMonthTitle(monthKey);
  const labelClass = cn(
    'font-display font-semibold tracking-tight text-ink-900',
    size === 'lg' ? 'text-[22px]' : 'text-[20px]'
  );

  return (
    <div className="flex items-center justify-between">
      <ArrowButton
        direction="prev"
        disabled={!canPrev}
        onClick={onPrev}
        label="Предыдущий месяц"
      />
      {onOpenCalendar ? (
        <button
          type="button"
          onClick={onOpenCalendar}
          className={cn('tappable px-2', labelClass)}
          aria-label={`${title}. Открыть календарь`}
        >
          {title}
        </button>
      ) : (
        <span className={cn('px-2', labelClass)}>{title}</span>
      )}
      <ArrowButton
        direction="next"
        disabled={!canNext}
        onClick={onNext}
        label="Следующий месяц"
      />
    </div>
  );
}

function ArrowButton({
  direction,
  disabled,
  onClick,
  label,
}: {
  direction: 'prev' | 'next';
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="tappable grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-500 disabled:pointer-events-none disabled:text-ink-200"
    >
      <Icon size={22} />
    </button>
  );
}
