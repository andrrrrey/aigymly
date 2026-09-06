'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Sparkles, Loader2, RefreshCw, Lock, ChevronRight } from 'lucide-react';
import { formatMonthTitle, type MonthStats } from '@/lib/statsMonth';
import { EmptyNote } from './StatsSection';

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'done'; text: string }
  | { kind: 'error'; message: string };

function buildPayload(stats: MonthStats) {
  return {
    monthTitle: formatMonthTitle(stats.monthKey),
    workoutCount: stats.workoutCount,
    perWeek: stats.perWeek,
    totalTonnageKg: stats.totalTonnageKg,
    avgTonnageKg: stats.avgTonnageKg,
    totalSets: stats.totalSets,
    strength: stats.strength.map((e) => ({
      name: e.name,
      currentOneRm: e.currentOneRm,
      deltaKg: e.deltaKg,
      deltaPct: e.deltaPct,
    })),
    balance: stats.balance.map((g) => ({ group: g.group, percent: g.percent })),
  };
}

export function AiSummaryBlock({ stats, isPro }: { stats: MonthStats; isPro: boolean }) {
  const [state, setState] = useState<State>({ kind: 'idle' });
  // Cache summaries per month so switching back and forth doesn't re-hit the API.
  const cache = useRef<Map<string, string>>(new Map());

  const load = async (force = false) => {
    if (!isPro) return;
    if (stats.workoutCount === 0) return;
    if (!force) {
      const cached = cache.current.get(stats.monthKey);
      if (cached) {
        setState({ kind: 'done', text: cached });
        return;
      }
    }
    setState({ kind: 'loading' });
    try {
      const res = await fetch('/api/ai/stats-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(stats)),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setState({ kind: 'error', message: 'Войдите в аккаунт, чтобы получить сводку от AI.' });
        } else if (data?.error === 'OPENAI_KEY_MISSING') {
          setState({
            kind: 'error',
            message: 'Сводка недоступна: администратор ещё не настроил ключ OpenAI.',
          });
        } else {
          setState({ kind: 'error', message: 'Не удалось собрать сводку. Попробуйте ещё раз.' });
        }
        return;
      }
      const data = await res.json();
      const text = typeof data?.summary === 'string' ? data.summary : '';
      if (!text) {
        setState({ kind: 'error', message: 'Не удалось собрать сводку. Попробуйте ещё раз.' });
        return;
      }
      cache.current.set(stats.monthKey, text);
      setState({ kind: 'done', text });
    } catch {
      setState({ kind: 'error', message: 'Ошибка сети. Проверьте соединение и попробуйте снова.' });
    }
  };

  // Refetch (or read from cache) whenever the selected month changes.
  useEffect(() => {
    if (!isPro || stats.workoutCount === 0) {
      setState({ kind: 'idle' });
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.monthKey, stats.workoutCount, isPro]);

  return (
    <section className="mt-7">
      <div className="mb-2">
        <h2 className="flex items-center gap-1.5 text-[17px] font-semibold tracking-tight text-ink-900">
          <Sparkles size={17} className="text-brand" />
          Сводка от AI
        </h2>
      </div>

      {!isPro ? (
        <Link
          href="/subscribe"
          className="tappable flex items-center gap-3 rounded-2xl border border-ink-100 bg-ink-50 p-4"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
            <Lock size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold text-ink-900">
              Аналитика от AI — по подписке
            </span>
            <span className="block text-[12px] leading-snug text-ink-500">
              Разбор тренировок и персональные рекомендации в Ai Gymly Pro
            </span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-ink-300" />
        </Link>
      ) : stats.workoutCount === 0 ? (
        <EmptyNote>
          В этом месяце ещё нет отмеченных тренировок. Отмечайте подходы галочкой — и AI
          соберёт для вас сводку и рекомендации.
        </EmptyNote>
      ) : state.kind === 'loading' ? (
        <div className="flex items-center gap-2.5 rounded-2xl border border-ink-100 bg-ink-50 p-4 text-[13px] text-ink-500">
          <Loader2 size={16} className="animate-spin text-brand" />
          AI анализирует ваши тренировки…
        </div>
      ) : state.kind === 'error' ? (
        <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4">
          <p className="text-[13px] leading-snug text-ink-500">{state.message}</p>
          <button
            type="button"
            onClick={() => load(true)}
            className="tappable mt-3 flex items-center gap-1.5 rounded-full bg-ink-100 px-3.5 py-2 text-[13px] font-semibold text-ink-700"
          >
            <RefreshCw size={14} />
            Попробовать снова
          </button>
        </div>
      ) : state.kind === 'done' ? (
        <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4">
          <div className="space-y-2 whitespace-pre-line text-[14px] leading-relaxed text-ink-700">
            {state.text}
          </div>
        </div>
      ) : null}
    </section>
  );
}
