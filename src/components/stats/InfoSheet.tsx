'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Small "(?)" affordance that sits next to a block title.
export function InfoButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="tappable grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink-100 text-[12px] font-semibold leading-none text-ink-400"
    >
      ?
    </button>
  );
}

// Explanatory bottom sheet. Follows the same recipe as ExercisePicker so all
// sheets in the app animate identically.
export function InfoSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ink-900/40"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85dvh] max-w-[440px] flex-col rounded-t-3xl bg-white shadow-elevated"
          >
            <div className="flex shrink-0 justify-center px-5 pb-2 pt-4">
              <div className="h-1 w-10 rounded-full bg-ink-200" />
            </div>
            <div
              className="no-scrollbar flex-1 overflow-y-auto px-5 pt-2"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
            >
              <h3 className="text-[19px] font-semibold tracking-tight text-ink-900">
                {title}
              </h3>
              <div className="mt-2 space-y-3 text-[14px] leading-relaxed text-ink-500">
                {children}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="tappable mt-5 h-12 w-full rounded-2xl bg-ink-100 text-[15px] font-medium text-ink-900"
              >
                Понятно
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Outbound link used at the bottom of an InfoSheet.
export function InfoSheetLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="tappable inline-flex items-center gap-1 text-[14px] font-medium text-brand"
    >
      {children}
    </a>
  );
}
