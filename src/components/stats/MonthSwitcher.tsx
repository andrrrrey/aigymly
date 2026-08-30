'use client';

import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
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
        <div className="flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenCalendar}
            className={cn('tappable truncate px-1', labelClass)}
            aria-label={`${title}. Открыть календарь`}
          >
            {title}
          </button>
          <button
            type="button"
            onClick={onOpenCalendar}
            aria-label="Открыть календарь месяца"
            className="tappable grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-500 hover:bg-ink-50"
          >
            <CalendarDays size={18} />
          </button>
        </div>
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
