'use client';

import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function SubscribeFailPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-white px-8 text-center">
      <XCircle size={56} className="text-marker-red" />
      <h1 className="mt-4 text-[22px] font-semibold tracking-tight text-ink-900">
        Платёж не прошёл
      </h1>
      <p className="mt-1.5 text-[14px] text-ink-500">
        Оплата была отменена или отклонена. Вы можете попробовать ещё раз.
      </p>
      <div className="mt-7 flex items-center gap-3">
        <Link
          href="/subscribe"
          className="tappable rounded-full bg-brand px-6 py-3 text-[15px] font-semibold text-white shadow-fab"
        >
          Попробовать снова
        </Link>
        <Link
          href="/profile"
          className="tappable rounded-full px-6 py-3 text-[15px] font-semibold text-ink-500"
        >
          В профиль
        </Link>
      </div>
    </main>
  );
}
