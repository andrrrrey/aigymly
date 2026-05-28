'use client';

import Link from 'next/link';
import { Sparkles, ChevronRight, Plus } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';

export default function ProgramsPage() {
  return (
    <>
      <header
        className="shrink-0 bg-white"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="px-5 pb-3 pt-3">
          <h1 className="font-display text-[28px] font-semibold tracking-tight text-ink-900">
            Программы
          </h1>
        </div>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto bg-white px-5 pb-24 pt-2">
        {/* AI banner — main CTA */}
        <Link
          href="/questionnaire"
          className="tappable mb-5 block overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-5 text-white shadow-elevated"
        >
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15">
              <Sparkles size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[18px] font-semibold tracking-tight">
                Программа от AI
              </h3>
              <p className="mt-1 text-[13px] leading-snug text-white/85">
                Ответь на 10 вопросов — AI соберёт персональную программу под твою цель
              </p>
            </div>
            <ChevronRight size={20} className="shrink-0 text-white/70" />
          </div>
        </Link>

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold tracking-tight text-ink-900">
            Мои программы
          </h2>
          <button className="tappable -mr-2 grid h-9 w-9 place-items-center rounded-full text-brand">
            <Plus size={20} strokeWidth={2.4} />
          </button>
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-ink-200 p-5 text-center">
          <p className="text-[13px] text-ink-500">
            Здесь будут все твои программы тренировок — как созданные руками, так и сгенерированные AI
          </p>
        </div>
      </main>

      <BottomNav />
    </>
  );
}
