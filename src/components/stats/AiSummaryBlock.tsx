'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
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

export function AiSummaryBlock({ stats }: { stats: MonthStats }) {
  const [state, setState] = useState<State>({ kind: 'idle' });
  // Cache summaries per month so switching back and forth doesn't re-hit the API.
  const cache = useRef<Map<string, string>>(new Map());

  const load = async (force = false) => {
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
    if (stats.workoutCount === 0) {
      setState({ kind: 'idle' });
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.monthKey, stats.workoutCount]);

  return (
    <section className="mt-7">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-[17px] font-semibold tracking-tight text-ink-900">
          <Sparkles size={17} className="text-brand" />
          Сводка от AI
        </h2>
        {state.kind === 'done' && (
          <button
            type="button"
            onClick={() => load(true)}
            className="tappable flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-medium text-ink-400 hover:bg-ink-50"
            aria-label="Обновить сводку"
          >
            <RefreshCw size={13} />
            Обновить
          </button>
        )}
      </div>

      {stats.workoutCount === 0 ? (
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
