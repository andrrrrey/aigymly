'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/store/auth';

export default function SubscribeSuccessPage() {
  const hydrate = useAuth((s) => s.hydrate);
  const [state, setState] = useState<'pending' | 'active' | 'timeout'>('pending');

  useEffect(() => {
    let active = true;
    let tries = 0;
    // The webhook confirms the payment asynchronously; poll until the
    // subscription flips to active (or give up after a while).
    const tick = async () => {
      tries += 1;
      try {
        const res = await fetch('/api/subscription', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.isPro) {
            if (active) {
              setState('active');
              hydrate();
            }
            return;
          }
        }
      } catch {
        /* keep polling */
      }
      if (!active) return;
      if (tries >= 10) {
        setState('timeout');
        return;
      }
      setTimeout(tick, 2000);
    };
    tick();
    return () => {
      active = false;
    };
  }, [hydrate]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-white px-8 text-center">
      {state === 'active' ? (
        <>
          <CheckCircle size={56} className="text-marker-green" />
          <h1 className="mt-4 text-[22px] font-semibold tracking-tight text-ink-900">
            Подписка активна
          </h1>
          <p className="mt-1.5 text-[14px] text-ink-500">
            Спасибо! Все Pro-функции теперь доступны.
          </p>
        </>
      ) : state === 'timeout' ? (
        <>
          <Loader2 size={48} className="animate-spin text-brand" />
          <h1 className="mt-4 text-[20px] font-semibold tracking-tight text-ink-900">
            Обрабатываем платёж
          </h1>
          <p className="mt-1.5 text-[14px] text-ink-500">
            Оплата подтверждается. Это может занять пару минут — обновите профиль чуть позже.
          </p>
        </>
      ) : (
        <>
          <Loader2 size={48} className="animate-spin text-brand" />
          <h1 className="mt-4 text-[20px] font-semibold tracking-tight text-ink-900">
            Подтверждаем оплату…
          </h1>
        </>
      )}

      <Link
        href="/profile"
        className="tappable mt-7 rounded-full bg-brand px-6 py-3 text-[15px] font-semibold text-white shadow-fab"
      >
        В профиль
      </Link>
    </main>
  );
}
