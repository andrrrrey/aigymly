'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import { AuthSheet } from '@/components/auth/AuthSheet';
import { useAuth } from '@/store/auth';
import { ChevronRight, Settings, LogOut, CheckCircle, AlertCircle, Mail, Loader2, Send } from 'lucide-react';

// Separate component to use useSearchParams inside Suspense
function BannerFromURL({ onBanner }: { onBanner: (b: 'verified' | 'error' | null) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get('verified') === '1') {
      onBanner('verified');
      window.history.replaceState({}, '', '/profile');
    } else if (searchParams.get('error') === 'invalid_token') {
      onBanner('error');
      window.history.replaceState({}, '', '/profile');
    }
  }, [searchParams, onBanner]);
  return null;
}

export default function ProfilePage() {
  const { user, loading, logout, hydrate } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [banner, setBanner] = useState<'verified' | 'error' | null>(null);
  const [resending, setResending] = useState(false);
  const [pin, setPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');

  const [resendDone, setResendDone] = useState(false);

  async function resendVerification() {
    setResending(true);
    setPinError('');
    setResendDone(false);
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' });
      if (res.ok) {
        setPin('');
        setResendDone(true);
      }
    } finally {
      setResending(false);
    }
  }

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPinError('');
    setPinLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPinError(data.error === 'INVALID_PIN' ? 'Неверный или истёкший код' : 'Ошибка сервера');
        return;
      }
      await hydrate();
      setBanner('verified');
      setPinSent(false);
    } finally {
      setPinLoading(false);
    }
  }

  const avatarLetter = user?.email?.[0]?.toUpperCase() ?? 'Г';

  return (
    <>
      <Suspense fallback={null}>
        <BannerFromURL onBanner={setBanner} />
      </Suspense>

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
        {/* Banners */}
        {banner === 'verified' && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-marker-green/10 px-4 py-3 text-[13px] text-marker-green">
            <CheckCircle size={16} className="shrink-0" />
            <span>Email успешно подтверждён!</span>
            <button onClick={() => setBanner(null)} className="ml-auto text-marker-green/60">✕</button>
          </div>
        )}
        {banner === 'error' && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-marker-red/10 px-4 py-3 text-[13px] text-marker-red">
            <AlertCircle size={16} className="shrink-0" />
            <span>Ссылка для подтверждения устарела или недействительна.</span>
            <button onClick={() => setBanner(null)} className="ml-auto text-marker-red/60">✕</button>
          </div>
        )}

        {/* Avatar + info */}
        <div className="flex items-center gap-4 py-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-[22px] font-semibold text-white">
            {avatarLetter}
          </div>
          <div className="min-w-0">
            {loading ? (
              <div className="h-4 w-32 animate-pulse rounded-full bg-ink-100" />
            ) : user ? (
              <>
                <h2 className="truncate text-[18px] font-semibold tracking-tight text-ink-900">
                  {user.email}
                </h2>
                {!user.emailVerified && (
                  <p className="text-[12px] text-marker-orange">Email не подтверждён</p>
                )}
              </>
            ) : (
              <>
                <h2 className="text-[18px] font-semibold tracking-tight text-ink-900">Гость</h2>
                <p className="text-[13px] text-ink-500">Войдите, чтобы синхронизировать данные</p>
              </>
            )}
          </div>
        </div>

        {/* Auth button */}
        {!loading && (
          user ? (
            <div className="mt-2 space-y-2">
              {!user.emailVerified && (
                <div className="rounded-2xl bg-marker-orange/10 px-4 py-3 space-y-3">
                  <p className="text-[13px] text-marker-orange">
                    Введите 4-значный код из письма на {user.email}
                  </p>
                  <form onSubmit={handlePinSubmit} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={4}
                        placeholder="0000"
                        value={pin}
                        onChange={(e) => {
                          setPinError('');
                          setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                        }}
                        className="w-24 rounded-xl border border-ink-200 bg-white px-3 py-2 text-center text-[18px] font-bold tracking-widest text-ink-900 focus:border-brand focus:outline-none"
                        required
                      />
                      <button
                        type="submit"
                        disabled={pinLoading || pin.length < 4}
                        className="flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
                      >
                        {pinLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        Подтвердить
                      </button>
                    </div>
                    {pinError && <p className="text-[12px] text-marker-red">{pinError}</p>}
                  </form>
                  {resendDone ? (
                    <p className="text-[12px] text-marker-green">✓ Новый код отправлен на {user.email}</p>
                  ) : (
                    <button
                      onClick={resendVerification}
                      disabled={resending}
                      className="text-[12px] text-marker-orange underline-offset-2 underline disabled:opacity-60"
                    >
                      {resending ? 'Отправляем...' : 'Отправить код снова'}
                    </button>
                  )}
                </div>
              )}
              <button
                onClick={() => logout()}
                className="tappable flex w-full items-center justify-center gap-2 rounded-full border border-ink-200 py-3 text-[15px] font-semibold text-ink-700 transition-colors hover:bg-ink-50"
              >
                <LogOut size={18} />
                Выйти
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSheetOpen(true)}
              className="tappable mt-2 flex w-full items-center justify-center rounded-full bg-brand py-3 text-[15px] font-semibold text-white shadow-fab"
            >
              Войти / Зарегистрироваться
            </button>
          )
        )}

        <div className="mt-6 space-y-1">
          <ProfileRow label="Личные данные" />
          <ProfileRow label="Опросник и программа" />
          <ProfileRow label="Уведомления" />
          <ProfileRow label="Единицы измерения" />
          <ProfileRow label="Помощь и поддержка" />
        </div>
      </main>

      <BottomNav />
      <AuthSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
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
