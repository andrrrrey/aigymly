'use client';

import { useId, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { motion, useReducedMotion } from 'framer-motion';
import { formatNumRu } from '@/lib/utils';
import type { TrainingDay } from '@/lib/statsMonth';

const VB_W = 320;
const VB_H = 200;
const PAD_TOP = 14;
const PAD_RIGHT = 12;
const PAD_BOTTOM = 26;

const BRAND = '#2F6BFF';
const GRID = '#EFF1F5';
const MUTED = '#9099A8';

// Rounds a raw axis step up to 1, 2 or 5 × a power of ten, so gridlines land
// on readable numbers (2 000) instead of fractions of the maximum (2 046).
function niceStep(raw: number): number {
  if (raw <= 0) return 1;
  const base = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / base;
  return (n > 5 ? 10 : n > 2 ? 5 : n > 1 ? 2 : 1) * base;
}

// Monotone cubic interpolation (Fritsch–Carlson). Unlike Catmull-Rom it never
// overshoots the data, so the curve cannot dip below zero between a heavy day
// and a light one — which for tonnage would be nonsense.
function monotonePath(xs: number[], ys: number[]): string {
  const n = xs.length;
  if (n < 2) return '';

  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) slopes.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));

  const m: number[] = new Array(n);
  m[0] = slopes[0];
  m[n - 1] = slopes[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = (slopes[i - 1] + slopes[i]) / 2;

  for (let i = 0; i < n - 1; i++) {
    if (slopes[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / slopes[i];
    const b = m[i + 1] / slopes[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * slopes[i];
      m[i + 1] = t * b * slopes[i];
    }
  }

  const r = (v: number) => Math.round(v * 100) / 100;
  let d = `M${r(xs[0])},${r(ys[0])}`;
  for (let i = 0; i < n - 1; i++) {
    const dx = (xs[i + 1] - xs[i]) / 3;
    d += ` C${r(xs[i] + dx)},${r(ys[i] + m[i] * dx)} ${r(xs[i + 1] - dx)},${r(
      ys[i + 1] - m[i + 1] * dx
    )} ${r(xs[i + 1])},${r(ys[i + 1])}`;
  }
  return d;
}

export function TonnageChart({
  points,
  avg,
  max,
  selectedIndex,
  onSelect,
}: {
  points: TrainingDay[];
  avg: number;
  max: number;
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const gradientId = useId();
  const reduceMotion = useReducedMotion();
  const n = points.length;

  const plotH = VB_H - PAD_TOP - PAD_BOTTOM;
  const baseY = PAD_TOP + plotH;
  const yMax = max > 0 ? max * 1.1 : 1;

  // Gridlines every `step` up to yMax — the 10% headroom is kept, but the
  // labels stay round.
  const ticks = useMemo(() => {
    if (max <= 0) return [0];
    const step = niceStep(yMax / 4);
    const out: number[] = [];
    for (let v = 0; v <= yMax && out.length < 7; v += step) out.push(v);
    return out;
  }, [max, yMax]);

  // The left gutter has to fit the widest Y label actually rendered.
  const topTick = ticks[ticks.length - 1];
  const padLeft = topTick >= 1_000_000 ? 50 : topTick >= 100_000 ? 44 : 38;
  const plotW = VB_W - padLeft - PAD_RIGHT;

  const geometry = useMemo(() => {
    const xOf = (i: number) =>
      n === 1 ? padLeft + plotW / 2 : padLeft + (i / (n - 1)) * plotW;
    const yOf = (v: number) => PAD_TOP + plotH - (v / yMax) * plotH;
    const xs = points.map((_, i) => xOf(i));
    const ys = points.map((p) => yOf(p.tonnageKg));
    const line = monotonePath(xs, ys);
    const area =
      line === ''
        ? ''
        : `${line} L${xs[n - 1]},${baseY} L${xs[0]},${baseY} Z`;
    return { xs, ys, line, area, yOf };
  }, [points, n, padLeft, plotW, plotH, yMax, baseY]);

  const { xs, ys, line, area, yOf } = geometry;

  // Never label every point — a 20-day month would be unreadable.
  const labelStep = Math.max(1, Math.ceil(n / 5));
  const avgY = yOf(avg);
  const avgLabelAbove = avgY > PAD_TOP + 12;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full"
      // Let vertical page scrolling pass through while still receiving taps.
      style={{ touchAction: 'pan-y' }}
      role="img"
      aria-label="График нагрузки по дням тренировок"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BRAND} stopOpacity={0.18} />
          <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Horizontal grid */}
      {ticks.map((v) => {
        const y = PAD_TOP + plotH - (v / yMax) * plotH;
        return (
          <g key={v}>
            <line
              x1={padLeft}
              x2={VB_W - PAD_RIGHT}
              y1={y}
              y2={y}
              stroke={GRID}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={padLeft - 6}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={9}
              fill={MUTED}
              className="tabular"
            >
              {formatNumRu(v)}
            </text>
          </g>
        );
      })}

      {/* Average */}
      {avg > 0 && (
        <>
          <line
            x1={padLeft}
            x2={VB_W - PAD_RIGHT}
            y1={avgY}
            y2={avgY}
            stroke={MUTED}
            strokeWidth={1}
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
          />
          <text
            x={VB_W - PAD_RIGHT}
            y={avgLabelAbove ? avgY - 4 : avgY + 10}
            textAnchor="end"
            fontSize={9}
            fill={MUTED}
          >
            среднее
          </text>
        </>
      )}

      {/* Area + curve */}
      {area && (
        <motion.path
          d={area}
          fill={`url(#${gradientId})`}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.3 }}
        />
      )}
      {line && (
        <motion.path
          d={line}
          fill="none"
          stroke={BRAND}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduceMotion ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      )}

      {/* Guide for the selected day */}
      {n > 0 && selectedIndex >= 0 && selectedIndex < n && (
        <line
          x1={xs[selectedIndex]}
          x2={xs[selectedIndex]}
          y1={PAD_TOP}
          y2={baseY}
          stroke={BRAND}
          strokeOpacity={0.25}
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />
      )}

      {/* Points */}
      {points.map((p, i) => {
        const active = i === selectedIndex;
        return (
          <motion.circle
            key={p.date}
            cx={xs[i]}
            cy={ys[i]}
            r={active ? 4.5 : 3}
            fill={active ? BRAND : '#fff'}
            stroke={active ? '#fff' : BRAND}
            strokeWidth={2}
            initial={reduceMotion ? false : { opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.03, duration: 0.2 }}
            // Without these, framer scales SVG children about the user-space
            // origin and the dots fly in from the top-left corner.
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        );
      })}

      {/* X labels */}
      {points.map((p, i) =>
        i % labelStep === 0 || i === n - 1 ? (
          <text
            key={p.date}
            x={xs[i]}
            y={baseY + 14}
            textAnchor="middle"
            fontSize={9}
            fill={MUTED}
            className="tabular"
          >
            {format(parseISO(p.date), 'd')}
          </text>
        ) : null
      )}

      {/* Hit slices, rendered last so they always win the hit test */}
      {points.map((p, i) => {
        const left = i === 0 ? padLeft : (xs[i - 1] + xs[i]) / 2;
        const right = i === n - 1 ? VB_W - PAD_RIGHT : (xs[i] + xs[i + 1]) / 2;
        return (
          <rect
            key={p.date}
            x={left}
            y={PAD_TOP}
            width={Math.max(right - left, 1)}
            height={plotH}
            fill="transparent"
            onPointerDown={() => onSelect(i)}
          />
        );
      })}
    </svg>
  );
}
