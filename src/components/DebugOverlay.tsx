'use client';

import { useEffect, useRef, useState } from 'react';

// On-device diagnostics overlay. Enabled only when the URL contains ?debug=1
// (the flag is then remembered for the session so it survives in-app
// navigation). Ordinary users never see it.
//
// It captures the things we can't read from a phone otherwise: JS errors and
// unhandled promise rejections, main-thread "long tasks" (jank), page-load
// timings, and the heaviest scripts/requests. Open app.aigymly.ru/?debug=1 on
// the phone, reproduce the problem, then Copy the log and send it over.

type Line = { t: number; kind: string; text: string };

function isEnabled(): boolean {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('debug') === '1') {
      sessionStorage.setItem('aigymly-debug', '1');
      return true;
    }
    return sessionStorage.getItem('aigymly-debug') === '1';
  } catch {
    return false;
  }
}

export function DebugOverlay() {
  const [on, setOn] = useState(false);
  const [open, setOpen] = useState(true);
  const [lines, setLines] = useState<Line[]>([]);
  const longTaskCount = useRef(0);
  const longTaskTotal = useRef(0);

  const push = (kind: string, text: string) =>
    setLines((prev) => [...prev.slice(-200), { t: Date.now(), kind, text }]);

  useEffect(() => {
    if (!isEnabled()) return;
    setOn(true);

    const started = performance.now();
    push('info', `debug on · ${navigator.userAgent}`);

    // --- JS errors ---------------------------------------------------------
    const onError = (e: ErrorEvent) => {
      push('error', `${e.message} @ ${e.filename?.split('/').pop() ?? '?'}:${e.lineno}`);
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason;
      push('error', `unhandled: ${r?.message ?? String(r)}`);
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    // --- console.error / warn ---------------------------------------------
    const origErr = console.error;
    const origWarn = console.warn;
    console.error = (...a: unknown[]) => {
      push('error', a.map(String).join(' ').slice(0, 300));
      origErr(...a);
    };
    console.warn = (...a: unknown[]) => {
      push('warn', a.map(String).join(' ').slice(0, 300));
      origWarn(...a);
    };

    // --- long tasks (main-thread jank) ------------------------------------
    let longTaskObs: PerformanceObserver | undefined;
    try {
      longTaskObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          longTaskCount.current += 1;
          longTaskTotal.current += entry.duration;
        }
        push(
          'jank',
          `long tasks: ${longTaskCount.current}, total ${Math.round(
            longTaskTotal.current
          )}ms`
        );
      });
      longTaskObs.observe({ entryTypes: ['longtask'] });
    } catch {
      push('info', 'longtask API не поддерживается этим браузером');
    }

    // --- load timing + heaviest resources (after load) --------------------
    const report = () => {
      try {
        const nav = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming | undefined;
        if (nav) {
          push(
            'time',
            `TTFB ${Math.round(nav.responseStart)}ms · DOMready ${Math.round(
              nav.domContentLoadedEventEnd
            )}ms · load ${Math.round(nav.loadEventEnd || performance.now())}ms`
          );
        }
        const res = performance.getEntriesByType(
          'resource'
        ) as PerformanceResourceTiming[];
        const scripts = res
          .filter((r) => r.initiatorType === 'script' || r.name.endsWith('.js'))
          .sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))
          .slice(0, 6);
        let jsTotal = 0;
        res
          .filter((r) => r.name.endsWith('.js'))
          .forEach((r) => (jsTotal += r.transferSize || 0));
        push('time', `JS total ~${Math.round(jsTotal / 1024)}KB (передано по сети)`);
        scripts.forEach((r) =>
          push(
            'res',
            `${Math.round((r.transferSize || 0) / 1024)}KB ${Math.round(
              r.duration
            )}ms ${r.name.split('/').pop()}`
          )
        );
      } catch (err) {
        push('error', `report failed: ${String(err)}`);
      }
    };
    if (document.readyState === 'complete') setTimeout(report, 800);
    else window.addEventListener('load', () => setTimeout(report, 800));

    push('info', `mount +${Math.round(performance.now() - started)}ms`);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      console.error = origErr;
      console.warn = origWarn;
      longTaskObs?.disconnect();
    };
  }, []);

  if (!on) return null;

  const dump = lines
    .map((l) => `${new Date(l.t).toISOString().slice(11, 19)} [${l.kind}] ${l.text}`)
    .join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(dump);
      push('info', 'скопировано ✓');
    } catch {
      push('info', 'копирование недоступно — сделайте скриншот');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        maxHeight: open ? '45vh' : 34,
        background: 'rgba(10,12,16,0.94)',
        color: '#d1d5db',
        fontFamily: 'ui-monospace, Menlo, monospace',
        fontSize: 11,
        lineHeight: 1.4,
        borderTop: '1px solid #374151',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          padding: '6px 10px',
          borderBottom: open ? '1px solid #374151' : 'none',
        }}
      >
        <strong style={{ color: '#f9fafb' }}>debug</strong>
        <span style={{ color: '#9ca3af' }}>
          jank {longTaskCount.current}/{Math.round(longTaskTotal.current)}ms · {lines.length}
        </span>
        <span style={{ flex: 1 }} />
        <button onClick={copy} style={btn}>
          copy
        </button>
        <button onClick={() => setLines([])} style={btn}>
          clr
        </button>
        <button onClick={() => setOpen((v) => !v)} style={btn}>
          {open ? '▾' : '▴'}
        </button>
      </div>
      {open && (
        <div style={{ overflowY: 'auto', padding: '6px 10px' }}>
          {lines.map((l, i) => (
            <div
              key={i}
              style={{
                color:
                  l.kind === 'error'
                    ? '#f87171'
                    : l.kind === 'jank'
                    ? '#fbbf24'
                    : l.kind === 'time' || l.kind === 'res'
                    ? '#93c5fd'
                    : '#d1d5db',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {l.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const btn: React.CSSProperties = {
  background: '#1f2937',
  color: '#e5e7eb',
  border: '1px solid #374151',
  borderRadius: 6,
  padding: '3px 8px',
  fontSize: 11,
};
