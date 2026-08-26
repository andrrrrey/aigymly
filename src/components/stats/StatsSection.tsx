'use client';

import { useState, type ReactNode } from 'react';
import { InfoButton, InfoSheet } from './InfoSheet';

// Section shell shared by every block of the stats feed: title row, optional
// "(?)" hint, content.
export function StatsSection({
  title,
  info,
  children,
}: {
  title: string;
  info?: { title: string; body: ReactNode; ariaLabel?: string };
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mt-7">
      <div className="mb-2 flex items-center gap-1.5">
        <h2 className="text-[17px] font-semibold tracking-tight text-ink-900">{title}</h2>
        {info && (
          <InfoButton onClick={() => setOpen(true)} label={info.ariaLabel ?? 'Подробнее'} />
        )}
      </div>
      {children}
      {info && (
        <InfoSheet open={open} onClose={() => setOpen(false)} title={info.title}>
          {info.body}
        </InfoSheet>
      )}
    </section>
  );
}

// The empty-state chrome used across the feed.
export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl bg-ink-50 p-4 text-[13px] leading-snug text-ink-500">
      {children}
    </p>
  );
}
