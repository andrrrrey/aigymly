'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Sparkles, ChevronRight, Crown } from 'lucide-react';

interface SubStatus {
  isPro: boolean;
  status: string;
  autoRenew: boolean;
  currentPeriodEnd: string | null;
  plan: { id: string; name: string } | null;
}

// Profile card summarising the user's subscription with an auto-renew toggle.
export function SubscriptionCard() {
  const [sub, setSub] = useState<SubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch('/api/subscription', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: SubStatus | null) => setSub(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleAutoRenew = async () => {
    if (!sub) return;
    const next = !sub.autoRenew;
    setSaving(true);
    setSub({ ...sub, autoRenew: next }); // optimistic
    try {
      await fetch('/api/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoRenew: next }),
      });
    } catch {
      setSub({ ...sub, autoRenew: !next }); // revert
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="h-16 animate-pulse rounded-2xl bg-ink-100" />;
  }

  if (!sub?.isPro) {
    return (
      <Link
        href="/subscribe"
        className="tappable flex items-center gap-3 rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-4 text-white shadow-elevated"
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15">
          <Sparkles size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold">Ai Gymly Pro</div>
          <div className="text-[12px] text-white/85">Чат с AI и безлимит программ</div>
        </div>
        <ChevronRight size={18} className="shrink-0 text-white/70" />
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border border-ink-100 p-4">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/10 text-brand">
          <Crown size={16} />
        </span>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-ink-900">
            Pro активна{sub.plan ? ` — ${sub.plan.name}` : ''}
          </div>
          {sub.currentPeriodEnd && (
            <div className="text-[12px] text-ink-400">
              До {format(parseISO(sub.currentPeriodEnd), 'd MMMM yyyy', { locale: ru })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-ink-50 pt-3">
        <span className="text-[14px] text-ink-700">Автопродление</span>
        <button
          type="button"
          onClick={toggleAutoRenew}
          disabled={saving}
          aria-pressed={sub.autoRenew}
          className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-60 ${
            sub.autoRenew ? 'bg-brand' : 'bg-ink-200'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              sub.autoRenew ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
      {!sub.autoRenew && (
        <p className="mt-2 text-[12px] text-ink-400">
          Подписка не продлится автоматически и завершится в конце периода.
        </p>
      )}
    </div>
  );
}
