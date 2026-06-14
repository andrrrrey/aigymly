'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Sparkles, ChevronRight, Dumbbell } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { useAuth } from '@/store/auth';

interface ProgramSummary {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
}

export default function ProgramsPage() {
  const user = useAuth((s) => s.user);
  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!user) {
      setPrograms([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch('/api/programs')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ProgramSummary[]) => {
        if (active) setPrograms(data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

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
                Ответь на несколько вопросов — AI соберёт персональную программу на 8 недель
              </p>
            </div>
            <ChevronRight size={20} className="shrink-0 text-white/70" />
          </div>
        </Link>

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold tracking-tight text-ink-900">
            Мои программы
          </h2>
        </div>

        {loading ? (
          <div className="mt-8 text-center text-[13px] text-ink-400">Загрузка…</div>
        ) : programs.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-ink-200 p-5 text-center">
            <p className="text-[13px] text-ink-500">
              {user
                ? 'Пока нет программ. Пройди опрос — и AI соберёт первую программу под тебя.'
                : 'Войди в аккаунт, чтобы создавать и хранить программы.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {programs.map((p) => (
              <Link
                key={p.id}
                href={'/programs/' + p.id}
                className="tappable flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                  <Dumbbell size={20} strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold text-ink-900">
                    {p.title}
                  </div>
                  <div className="truncate text-[12px] text-ink-400">
                    {format(parseISO(p.createdAt), 'd MMMM yyyy', { locale: ru })}
                  </div>
                </div>
                <ChevronRight size={18} className="shrink-0 text-ink-300" />
              </Link>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </>
  );
}
