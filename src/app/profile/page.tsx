'use client';

import { BottomNav } from '@/components/BottomNav';
import { ChevronRight, Settings } from 'lucide-react';

export default function ProfilePage() {
  return (
    <>
      <header
        className="shrink-0 bg-white"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-5 py-3">
          <h1 className="font-display text-[28px] font-semibold tracking-tight text-ink-900">
            Профиль
          </h1>
          <button className="tappable -mr-2 grid h-9 w-9 place-items-center rounded-full text-ink-700">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto bg-white px-5 pb-24">
        <div className="flex items-center gap-4 py-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-[22px] font-semibold text-white">
            A
          </div>
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-ink-900">Гость</h2>
            <p className="text-[13px] text-ink-500">Войти, чтобы синхронизировать данные</p>
          </div>
        </div>

        <button className="tappable mt-2 flex w-full items-center justify-center rounded-full bg-brand py-3 text-[15px] font-semibold text-white shadow-fab">
          Войти / Зарегистрироваться
        </button>

        <div className="mt-6 space-y-1">
          <ProfileRow label="Личные данные" />
          <ProfileRow label="Опросник и программа" />
          <ProfileRow label="Уведомления" />
          <ProfileRow label="Единицы измерения" />
          <ProfileRow label="Помощь и поддержка" />
        </div>
      </main>
      <BottomNav />
    </>
  );
}

function ProfileRow({ label }: { label: string }) {
  return (
    <button className="tappable flex w-full items-center justify-between rounded-xl px-3 py-3.5 text-left hover:bg-ink-50">
      <span className="text-[15px] font-medium text-ink-900">{label}</span>
      <ChevronRight size={18} className="text-ink-300" />
    </button>
  );
}
