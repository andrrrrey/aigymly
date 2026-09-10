'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error for diagnostics instead of failing silently.
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        minHeight: '100dvh',
        padding: 24,
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <h1 style={{ fontSize: 18, fontWeight: 600 }}>Что-то пошло не так</h1>
      <p style={{ color: '#6b7280', maxWidth: 280 }}>
        Попробуйте обновить страницу. Если не помогает — откройте приложение в
        Safari или Chrome, а не во встроенном браузере.
      </p>
      <button
        onClick={reset}
        style={{
          padding: '10px 20px',
          borderRadius: 12,
          border: 'none',
          background: '#111827',
          color: '#fff',
          fontSize: 15,
          fontWeight: 500,
        }}
      >
        Обновить
      </button>
    </div>
  );
}
