'use client';

import { useEffect } from 'react';

// Catches errors thrown in the root layout itself (e.g. a module that throws at
// import time), which the segment-level error.tsx cannot. Replaces the silent
// blank white screen with a message and a reload button.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ru">
      <body style={{ margin: 0 }}>
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
            Попробуйте обновить страницу. Если не помогает — откройте приложение
            в Safari или Chrome, а не во встроенном браузере.
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
      </body>
    </html>
  );
}
