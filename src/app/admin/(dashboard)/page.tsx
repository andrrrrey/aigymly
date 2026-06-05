'use client';

import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

interface AdminUser {
  id: string;
  email: string;
  emailVerified: boolean;
  sex?: string;
  createdAt: string;
  workoutsCount: number;
  programsCount: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/users')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: AdminUser[]) => setUsers(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex items-baseline justify-between">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">
          Пользователи
        </h1>
        <span className="text-[13px] text-ink-400">Всего: {users.length}</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-ink-100 text-[12px] uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Дата регистрации</th>
                <th className="px-4 py-3 font-medium">Подтверждён</th>
                <th className="px-4 py-3 font-medium">Пол</th>
                <th className="px-4 py-3 font-medium">Тренировок</th>
                <th className="px-4 py-3 font-medium">Программ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-400">
                    Загрузка…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-400">
                    Пока нет зарегистрированных пользователей
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-ink-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-ink-900">{u.email}</td>
                    <td className="px-4 py-3 tabular text-ink-600">
                      {format(parseISO(u.createdAt), 'd MMM yyyy, HH:mm', { locale: ru })}
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
                    <td className="px-4 py-3 text-ink-600">
                      {u.sex === 'male' ? 'муж' : u.sex === 'female' ? 'жен' : '—'}
                    </td>
                    <td className="px-4 py-3 tabular text-ink-600">{u.workoutsCount}</td>
                    <td className="px-4 py-3 tabular text-ink-600">{u.programsCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
