'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Users, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminNav({ username }: { username: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  };

  const links = [
    { href: '/admin', label: 'Пользователи', icon: Users },
    { href: '/admin/settings', label: 'Настройки', icon: Settings },
  ];

  return (
    <header className="flex items-center gap-4 border-b border-ink-200 bg-white px-5 py-3">
      <span className="text-[16px] font-semibold tracking-tight text-ink-900">
        Ai Gymly · Админ
      </span>
      <nav className="flex items-center gap-1">
        {links.map((l) => {
          const active = pathname === l.href;
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[14px] font-medium transition-colors',
                active ? 'bg-brand/10 text-brand' : 'text-ink-500 hover:text-ink-900'
              )}
            >
              <Icon size={16} />
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="ml-auto flex items-center gap-3">
        <span className="hidden text-[13px] text-ink-400 sm:inline">{username}</span>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[14px] font-medium text-ink-500 transition-colors hover:text-marker-red"
        >
          <LogOut size={16} />
          Выйти
        </button>
      </div>
    </header>
  );
}
