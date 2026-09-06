'use client';

import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Crown, Loader2 } from 'lucide-react';

interface UserSub {
  isPro: boolean;
  status: string;
  currentPeriodEnd: string | null;
  autoRenew: boolean;
  planName: string | null;
}

interface AdminUser {
  id: string;
  email: string;
  emailVerified: boolean;
  sex?: string;
  createdAt: string;
  workoutsCount: number;
  programsCount: number;
  subscription: UserSub;
}

interface AiMetrics {
  periodDays: number;
  payingUsers: number;
  programCount: number;
  statsCount: number;
  totalCostKopecks: number;
  costPerPayingUserKopecks: number | null;
  errorRate: number;
}

// Preset grant durations offered in the admin UI.
const GRANT_OPTIONS = [
  { label: 'Месяц', days: 30 },
  { label: 'Полгода', days: 182 },
  { label: 'Год', days: 365 },
];

function formatRub(kopecks: number | null): string {
  if (kopecks === null) return '—';
  return `${(kopecks / 100).toFixed(2)} ₽`;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [metrics, setMetrics] = useState<AiMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    fetch('/api/admin/users')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: AdminUser[]) => setUsers(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    fetch('/api/admin/ai-metrics')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: AiMetrics | null) => setMetrics(data))
      .catch(() => {});
  }, []);

  const grant = async (userId: string, days: number) => {
    setBusyId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/subscription`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'grant', days }),
      });
      if (res.ok) load();
    } finally {
      setBusyId(null);
    }
  };

  const revoke = async (userId: string) => {
    if (!confirm('Снять активную подписку у пользователя?')) return;
    setBusyId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/subscription`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke' }),
      });
      if (res.ok) load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      {metrics && (
        <section className="mb-6">
          <h2 className="mb-2 text-[15px] font-semibold tracking-tight text-ink-900">
            ИИ за последние {metrics.periodDays} дней
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: 'Себестоимость / платящий', value: formatRub(metrics.costPerPayingUserKopecks) },
              { label: 'Всего расходы ИИ', value: formatRub(metrics.totalCostKopecks) },
              { label: 'Генераций программ', value: String(metrics.programCount) },
              { label: 'Анализов статистики', value: String(metrics.statsCount) },
              { label: 'Доля ошибок', value: `${(metrics.errorRate * 100).toFixed(1)}%` },
            ].map((m) => (
              <div key={m.label} className="rounded-2xl border border-ink-200 bg-white p-4">
                <div className="text-[20px] font-semibold tabular text-ink-900">{m.value}</div>
                <div className="mt-0.5 text-[12px] leading-snug text-ink-400">{m.label}</div>
              </div>
            ))}
          </div>
          <p className="mt-2 px-1 text-[12px] text-ink-400">
            Оценка стоимости по ценам моделей и бюджетному курсу; повторные (кэшированные) анализы
            не расходуют токены и не попадают в расходы.
          </p>
        </section>
      )}

      <div className="mb-5 flex items-baseline justify-between">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">Пользователи</h1>
        <span className="text-[13px] text-ink-400">Всего: {users.length}</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-ink-100 text-[12px] uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Регистрация</th>
                <th className="px-4 py-3 font-medium">Подтв.</th>
                <th className="px-4 py-3 font-medium">Трен.</th>
                <th className="px-4 py-3 font-medium">Прогр.</th>
                <th className="px-4 py-3 font-medium">Подписка</th>
                <th className="px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-ink-400">
                    Загрузка…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-ink-400">
                    Пока нет зарегистрированных пользователей
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const sub = u.subscription;
                  return (
                    <tr key={u.id} className="border-b border-ink-50 last:border-0 align-middle">
                      <td className="px-4 py-3 font-medium text-ink-900">{u.email}</td>
                      <td className="px-4 py-3 tabular text-ink-600">
                        {format(parseISO(u.createdAt), 'd MMM yyyy', { locale: ru })}
                      </td>
                      <td className="px-4 py-3">
                        {u.emailVerified ? (
                          <span className="rounded-full bg-marker-green/10 px-2 py-0.5 text-[12px] font-medium text-marker-green">
                            да
                          </span>
                        ) : (
                          <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[12px] font-medium text-ink-400">
                            нет
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular text-ink-600">{u.workoutsCount}</td>
                      <td className="px-4 py-3 tabular text-ink-600">{u.programsCount}</td>
                      <td className="px-4 py-3">
                        {sub.isPro ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[12px] font-medium text-brand">
                            <Crown size={12} />
                            Pro
                            {sub.currentPeriodEnd && (
                              <span className="text-brand/70">
                                · до {format(parseISO(sub.currentPeriodEnd), 'd MMM yyyy', { locale: ru })}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[12px] text-ink-400">
                            {sub.status === 'canceled'
                              ? 'снята'
                              : sub.status === 'past_due'
                              ? 'просрочена'
                              : sub.status === 'pending'
                              ? 'ожидает оплаты'
                              : '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {busyId === u.id ? (
                            <Loader2 size={16} className="animate-spin text-brand" />
                          ) : sub.isPro ? (
                            <button
                              onClick={() => revoke(u.id)}
                              className="tappable rounded-full border border-ink-200 px-3 py-1 text-[12px] font-medium text-ink-600 hover:border-marker-red hover:text-marker-red"
                            >
                              Снять
                            </button>
                          ) : (
                            GRANT_OPTIONS.map((o) => (
                              <button
                                key={o.days}
                                onClick={() => grant(u.id, o.days)}
                                title={`Выдать Pro на ${o.label.toLowerCase()}`}
                                className="tappable rounded-full bg-brand/10 px-2.5 py-1 text-[12px] font-medium text-brand hover:bg-brand hover:text-white"
                              >
                                {o.label}
                              </button>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-3 px-1 text-[12px] text-ink-400">
        Выдача Pro вручную не включает автосписание и не требует оплаты. «Снять» отключает доступ
        сразу.
      </p>
    </div>
  );
}
