'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Check, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '@/store/auth';
import { formatNumRu } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  priceKopecks: number;
  periodDays: number;
}

interface SubStatus {
  isPro: boolean;
  status: string;
  autoRenew: boolean;
  currentPeriodEnd: string | null;
  plan: { id: string; name: string } | null;
}

const PRO_FEATURES = [
  'Программа тренировок с учётом ваших целей',
  'ИИ анализирует результаты каждой тренировки',
  'ИИ анализирует динамику ваших тренировок за выбранный период',
  'Подсказывает, как корректировать нагрузку дальше',
  'История программ и рекомендаций всегда доступна',
];

export default function SubscribePage() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const authLoading = useAuth((s) => s.loading);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [sub, setSub] = useState<SubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/plans').then((r) => (r.ok ? r.json() : [])),
      user ? fetch('/api/subscription').then((r) => (r.ok ? r.json() : null)) : Promise.resolve(null),
    ])
      .then(([p, s]) => {
        if (!active) return;
        setPlans(p);
        setSub(s);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user]);

  const subscribe = async (planId: string) => {
    setError('');
    if (!user) {
      router.push('/profile');
      return;
    }
    setBusyPlan(planId);
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (res.ok && data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      setError(
        data.error === 'TBANK_NOT_CONFIGURED'
          ? 'Оплата временно недоступна. Попробуйте позже.'
          : 'Не удалось создать платёж. Попробуйте ещё раз.'
      );
    } catch {
      setError('Сеть недоступна. Попробуйте ещё раз.');
    } finally {
      setBusyPlan(null);
    }
  };

  // Best value = lowest real per-month price across plans, highlighted with a badge.
  const bestPlanId =
    plans.length > 1
      ? plans.reduce((best, p) => {
          const perMonth = (n: Plan) => n.priceKopecks / Math.max(1, Math.round(n.periodDays / 30));
          return perMonth(p) < perMonth(best) ? p : best;
        }).id
      : null;

  return (
    <>
      <header
        className="shrink-0 border-b border-ink-100 bg-white"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-3 px-5 py-3">
          <button
            onClick={() => router.back()}
            className="tappable grid h-9 w-9 place-items-center rounded-full text-ink-500 hover:bg-ink-50"
            aria-label="Назад"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-[16px] font-semibold tracking-tight text-ink-900">Подписка Pro</h1>
        </div>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto bg-white px-5 pb-10 pt-4">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-5 text-white shadow-elevated">
          <div className="flex items-center gap-2">
            <Sparkles size={20} />
            <h2 className="text-[18px] font-semibold tracking-tight">Ai Gymly Pro</h2>
          </div>
          <ul className="mt-3 space-y-2">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[13px] leading-snug text-white/90">
                <Check size={15} strokeWidth={3} className="mt-0.5 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-white/15 px-3 py-2.5 text-[13px] leading-snug font-medium">
            <Check size={15} strokeWidth={3} className="mt-0.5 shrink-0" />
            <span>Новые функции Pro становятся доступны в рамках подписки</span>
          </div>
        </div>

        {sub?.isPro && (
          <div className="mt-4 rounded-2xl border border-marker-green/30 bg-marker-green/5 p-4">
            <p className="text-[14px] font-medium text-ink-900">
              Подписка активна{sub.plan ? ` — ${sub.plan.name}` : ''}
            </p>
            {sub.currentPeriodEnd && (
              <p className="mt-0.5 text-[13px] text-ink-500">
                Действует до {format(parseISO(sub.currentPeriodEnd), 'd MMMM yyyy', { locale: ru })}
                {sub.autoRenew ? ' · автопродление включено' : ' · автопродление выключено'}
              </p>
            )}
          </div>
        )}

        <h3 className="mb-3 mt-6 text-[15px] font-semibold tracking-tight text-ink-900">
          {sub?.isPro ? 'Сменить тариф' : 'Выберите тариф'}
        </h3>

        {loading || authLoading ? (
          <div className="mt-6 text-center text-[13px] text-ink-400">Загрузка…</div>
        ) : plans.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-ink-200 p-5 text-center text-[13px] text-ink-500">
            Тарифы временно недоступны.
          </div>
        ) : (
          <div className="space-y-2.5">
            {plans.map((p) => {
              const rub = Math.round(p.priceKopecks / 100);
              // Number of whole months the plan covers (30-day months), so the
              // per-month figure divides the price by the real month count
              // instead of the raw day ratio (e.g. 4990 ₽ / 12, not / 12.17).
              const months = Math.max(1, Math.round(p.periodDays / 30));
              const perMonth = months > 1 ? Math.round(rub / months) : null;
              const isBest = p.id === bestPlanId;
              return (
                <button
                  key={p.id}
                  onClick={() => subscribe(p.id)}
                  disabled={busyPlan !== null}
                  className={`tappable flex w-full items-center gap-3 rounded-2xl border bg-white p-4 text-left disabled:opacity-60 ${
                    isBest ? 'border-brand ring-1 ring-brand/30' : 'border-ink-200'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-semibold text-ink-900">{p.name}</span>
                      {isBest && (
                        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
                          Выгоднее всего
                        </span>
                      )}
                    </div>
                    {perMonth && (
                      <div className="mt-0.5 text-[12px] text-ink-400">≈ {formatNumRu(perMonth)} ₽ / мес</div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[17px] font-semibold text-ink-900">
                      {formatNumRu(rub)} ₽
                    </div>
                  </div>
                  {busyPlan === p.id && <Loader2 size={18} className="animate-spin text-brand" />}
                </button>
              );
            })}
          </div>
        )}

        {error && <p className="mt-4 text-center text-[13px] text-marker-red">{error}</p>}

        <p className="mt-6 text-center text-[11px] leading-relaxed text-ink-400">
          Оплата картой через T-Bank. Автопродление включается автоматически и
          отключается тумблером в профиле.
        </p>

        <div className="mt-5 border-t border-ink-50 pt-4 text-[11px] leading-relaxed text-ink-300">
          <div>В подписке Pro:</div>
          <ul className="mt-1 space-y-0.5">
            <li>— до 4 генераций или корректировок программ</li>
            <li>— ИИ-анализ прогресса после каждой тренировки — до 31 раза за 30 дней</li>
          </ul>
        </div>
      </main>
    </>
  );
}
