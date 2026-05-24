'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Dumbbell, MessageCircle, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/', icon: Calendar, label: 'Календарь' },
  { href: '/programs', icon: Dumbbell, label: 'Программы' },
  { href: '/chat', icon: MessageCircle, label: 'AI чат' },
  { href: '/stats', icon: BarChart3, label: 'Статистика' },
  { href: '/profile', icon: User, label: 'Профиль' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="shrink-0 border-t border-ink-100 bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-[60px] items-stretch justify-around px-2">
        {TABS.map((tab) => {
          const active =
            tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="tappable flex flex-1 flex-col items-center justify-center gap-0.5"
            >
              <Icon
                size={22}
                className={cn(
                  'transition-colors',
                  active ? 'text-brand' : 'text-ink-400'
                )}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span
                className={cn(
                  'text-[10px] font-medium tracking-tight transition-colors',
                  active ? 'text-brand' : 'text-ink-400'
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
