'use client';

import Link from 'next/link';
import { Sparkles, Lock, Check } from 'lucide-react';

// Reusable upsell shown where a feature requires an active subscription.
export function Paywall({
  title = 'Доступно по подписке',
  description = 'Оформите подписку Ai Gymly Pro, чтобы открыть эту функцию.',
  features = [
    'ИИ-программы тренировок',
    'ИИ-анализ прогресса после каждой тренировки',
    'Повторный просмотр программ и анализов',
  ],
}: {
  title?: string;
  description?: string;
  features?: string[];
}) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-2 py-8 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
        <Lock size={26} strokeWidth={2.2} />
      </div>
      <h2 className="mt-4 text-[19px] font-semibold tracking-tight text-ink-900">{title}</h2>
      <p className="mt-1.5 text-[14px] leading-snug text-ink-500">{description}</p>

      <ul className="mt-5 w-full space-y-2 text-left">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2.5 text-[14px] text-ink-700">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-marker-green/15 text-marker-green">
              <Check size={13} strokeWidth={3} />
            </span>
            {f}
          </li>
        ))}
      </ul>

      <Link
        href="/subscribe"
        className="tappable mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-[15px] font-semibold text-white shadow-fab"
      >
        <Sparkles size={18} />
        Оформить подписку
      </Link>
    </div>
  );
}
