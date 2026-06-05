'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { AuthInput } from '@/components/auth/AuthInput';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.replace('/admin');
        router.refresh();
        return;
      }
      setError(
        res.status === 401
          ? 'Неверный логин или пароль'
          : 'Не удалось войти. Попробуйте снова.'
      );
    } catch {
      setError('Ошибка сети. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-auto bg-ink-50 p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-elevated"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand/10 text-brand">
            <Lock size={22} />
          </div>
          <div>
            <h1 className="text-[18px] font-semibold text-ink-900">Админ-панель</h1>
            <p className="text-[13px] text-ink-400">Вход для администратора</p>
          </div>
        </div>

        <div className="space-y-3">
          <AuthInput
            label="Логин"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <AuthInput
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        {error && <p className="mt-3 text-[13px] text-marker-red">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="tappable mt-5 w-full rounded-full bg-brand px-5 py-3 text-[15px] font-semibold text-white shadow-fab disabled:opacity-60"
        >
          {loading ? 'Вход…' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
