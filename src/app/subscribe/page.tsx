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
  'Чат с AI-ассистентом',
  'Безлимит программ от AI',
  'Приоритетные обновления',
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
          <ul className="mt-3 space-y-1.5">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-[13px] text-white/90">
                <Check size={15} strokeWidth={3} />
                {f}
              </li>
            ))}
          </ul>
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
              const perMonth =
                p.periodDays >= 60
                  ? Math.round(p.priceKopecks / 100 / (p.periodDays / 30))
                  : null;
              return (
                <button
                  key={p.id}
                  onClick={() => subscribe(p.id)}
                  disabled={busyPlan !== null}
                  className="tappable flex w-full items-center gap-3 rounded-2xl border border-ink-200 bg-white p-4 text-left disabled:opacity-60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold text-ink-900">{p.name}</div>
                    {perMonth && (
                      <div className="text-[12px] text-ink-400">≈ {formatNumRu(perMonth)} ₽ / мес</div>
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
          Оплата картой через T-Bank. Подписка продлевается автоматически; отключить
          автопродление можно в профиле.
        </p>
      </main>
    </>
  );
}
