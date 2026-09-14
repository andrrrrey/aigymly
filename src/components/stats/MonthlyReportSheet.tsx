'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  formatMonthTitle,
  type MonthReportInput,
  type MonthKey,
  type MonthlyReport,
} from '@/lib/statsMonth';

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'done'; report: MonthlyReport }
  | { kind: 'error'; message: string };

// Full-screen reader for one month's archived AI report. Layered above the
// calendar sheet. The report is fetched (and, for a not-yet-generated month,
// generated then frozen) on first open and cached per month for the session.
export function MonthlyReportSheet({
  open,
  onClose,
  monthKey,
  buildPayload,
}: {
  open: boolean;
  onClose: () => void;
  monthKey: MonthKey | null;
  buildPayload: (monthKey: MonthKey) => MonthReportInput;
}) {
  const [state, setState] = useState<State>({ kind: 'idle' });
  const cache = useRef<Map<MonthKey, MonthlyReport>>(new Map());

  const load = async (mk: MonthKey, force = false) => {
    if (!force) {
      const cached = cache.current.get(mk);
      if (cached) {
        setState({ kind: 'done', report: cached });
        return;
      }
    }
    setState({ kind: 'loading' });
    try {
      const res = await fetch('/api/ai/monthly-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(mk)),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setState({ kind: 'error', message: 'Войдите в аккаунт, чтобы открыть отчёт.' });
        } else if (res.status === 402 || data?.error === 'SUBSCRIPTION_REQUIRED') {
          setState({ kind: 'error', message: 'AI-итоги доступны в подписке Ai Gymly Pro.' });
        } else if (data?.error === 'OPENAI_KEY_MISSING') {
          setState({
            kind: 'error',
            message: 'Отчёт недоступен: администратор ещё не настроил ключ OpenAI.',
          });
        } else if (data?.error === 'QUOTA_EXCEEDED') {
          setState({
            kind: 'error',
            message: 'Лимит генераций на этот период исчерпан. Отчёт будет доступен позже.',
          });
        } else if (res.status === 429) {
          setState({ kind: 'error', message: 'Слишком часто. Подождите немного и попробуйте снова.' });
        } else {
          setState({ kind: 'error', message: 'Не удалось собрать отчёт. Попробуйте ещё раз.' });
        }
        return;
      }
      const data = await res.json();
      const report = data?.report as MonthlyReport | undefined;
      if (!report || typeof report !== 'object') {
        setState({ kind: 'error', message: 'Не удалось собрать отчёт. Попробуйте ещё раз.' });
        return;
      }
      cache.current.set(mk, report);
      setState({ kind: 'done', report });
    } catch {
      setState({ kind: 'error', message: 'Ошибка сети. Проверьте соединение и попробуйте снова.' });
    }
  };

  useEffect(() => {
    if (open && monthKey) load(monthKey);
    if (!open) setState({ kind: 'idle' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, monthKey]);

  const title = monthKey ? `AI-итоги • ${formatMonthTitle(monthKey)}` : 'AI-итоги';

  return (
    <AnimatePresence>
      {open && monthKey && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-[60] mx-auto flex max-w-[440px] flex-col bg-white"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex shrink-0 items-center gap-2 px-5 pb-3 pt-3">
            <h2 className="min-w-0 flex-1 truncate text-[17px] font-semibold tracking-tight text-ink-900">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть отчёт"
              className="tappable -mr-2 grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-500"
            >
              <X size={22} />
            </button>
          </div>

          <div
            className="no-scrollbar flex-1 overflow-y-auto px-5"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
          >
            {state.kind === 'loading' ? (
              <div className="flex items-center gap-2.5 rounded-2xl border border-ink-100 bg-ink-50 p-4 text-[13px] text-ink-500">
                <Loader2 size={16} className="animate-spin text-brand" />
                AI собирает итоги месяца…
              </div>
            ) : state.kind === 'error' ? (
              <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4">
                <p className="text-[13px] leading-snug text-ink-500">{state.message}</p>
                <button
                  type="button"
                  onClick={() => monthKey && load(monthKey, true)}
                  className="tappable mt-3 flex items-center gap-1.5 rounded-full bg-ink-100 px-3.5 py-2 text-[13px] font-semibold text-ink-700"
                >
                  <RefreshCw size={14} />
                  Попробовать снова
                </button>
              </div>
            ) : state.kind === 'done' ? (
              <ReportBody report={state.report} />
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Block({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 first:mt-0">
      <h3 className="mb-2 flex items-center gap-1.5 text-[15px] font-semibold tracking-tight text-ink-900">
        <span className="text-brand">{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2 text-[14px] leading-snug text-ink-700">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-300" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function ReportBody({ report }: { report: MonthlyReport }) {
  return (
    <div className="pb-2">
      {report.mainConclusion && (
        <Block icon={<Sparkles size={16} />} title="Главный вывод">
          <p className="rounded-2xl border border-ink-100 bg-ink-50 p-4 text-[14px] leading-relaxed text-ink-800">
            {report.mainConclusion}
          </p>
        </Block>
      )}

      {report.keyFigures.length > 0 && (
        <Block icon={<BarChart3 size={16} />} title="Ключевые цифры">
          <div className="divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-100">
            {report.keyFigures.map((k, i) => (
              <div key={i} className="flex items-baseline gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium text-ink-900">{k.label}</div>
                  {k.note && <div className="mt-0.5 text-[12px] leading-snug text-ink-500">{k.note}</div>}
                </div>
                {k.value && (
                  <div className="shrink-0 text-[15px] font-semibold tabular-nums text-ink-900">
                    {k.value}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Block>
      )}

      {report.whatWorked.length > 0 && (
        <Block icon={<CheckCircle2 size={16} />} title="Что сработало">
          <Bullets items={report.whatWorked} />
        </Block>
      )}

      {report.needsAttention.length > 0 && (
        <Block icon={<AlertTriangle size={16} />} title="Что требует внимания">
          <Bullets items={report.needsAttention} />
        </Block>
      )}

      {report.recommendations.length > 0 && (
        <Block icon={<Target size={16} />} title="Рекомендации на следующий месяц">
          <Bullets items={report.recommendations} />
        </Block>
      )}

      {report.forecast && (
        <Block icon={<TrendingUp size={16} />} title="Прогноз">
          <p className="rounded-2xl border border-ink-100 bg-ink-50 p-4 text-[14px] leading-relaxed text-ink-700">
            {report.forecast}
          </p>
        </Block>
      )}
    </div>
  );
}
