"use client";

import { useState } from "react";

type Point = { periodo: string; valor: number; enCurso: boolean };

/**
 * Term averages over time: one series, so no legend (the heading names it). Ink line, 2px; first and
 * current values labeled; hover or tap a term for its value. The sr-only table is the same data.
 */
export function TrendChart({ serie }: { serie: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 400;
  const H = 110;
  const values = serie.map((s) => s.valor);
  const lo = Math.floor(Math.min(...values) - 2);
  const hi = Math.ceil(Math.max(...values) + 2);
  const x = (i: number) => 12 + (i * (W - 24)) / Math.max(1, serie.length - 1);
  const y = (v: number) => 82 - ((v - lo) / (hi - lo)) * 70;
  const last = serie.length - 1;
  const h = hover === null ? null : serie[hover]!;

  return (
    <figure className="relative mt-6 max-w-[520px] md:ml-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" aria-hidden="true">
        <line x1="0" y1="92" x2={W} y2="92" stroke="var(--border)" />
        <polyline
          points={serie.map((s, i) => `${x(i)},${y(s.valor)}`).join(" ")}
          fill="none"
          stroke="var(--fg)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {serie.map((s, i) => (
          <circle
            key={s.periodo}
            cx={x(i)}
            cy={y(s.valor)}
            r={i === last || hover === i ? 5 : 4}
            fill={i === last ? "var(--bg)" : "var(--fg)"}
            stroke={i === last ? "var(--fg)" : "var(--bg)"}
            strokeWidth="2"
          />
        ))}
        <text
          x={x(0)}
          y={y(serie[0]!.valor) - 10}
          fill="var(--fg-muted)"
          fontSize="12"
          className="tabular"
        >
          {serie[0]!.valor}
        </text>
        <text
          x={x(last)}
          y={y(serie[last]!.valor) - 12}
          fill="var(--fg)"
          fontSize="12"
          fontWeight="600"
          textAnchor="end"
          className="tabular"
        >
          {serie[last]!.valor} en curso
        </text>
        {serie.map((s, i) => (
          <text
            key={`l-${s.periodo}`}
            x={x(i)}
            y="108"
            fill="var(--fg-muted)"
            fontSize="11"
            textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}
            className="tabular"
          >
            {s.periodo}
          </text>
        ))}
        {serie.map((s, i) => (
          <rect
            key={`hit-${s.periodo}`}
            x={x(i) - (W - 24) / (2 * Math.max(1, last))}
            y="0"
            width={(W - 24) / Math.max(1, last)}
            height={H}
            fill="transparent"
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
          />
        ))}
      </svg>
      {h && hover !== null && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-caption shadow-overlay"
          style={{ left: `${(x(hover) / W) * 100}%`, transform: "translate(-50%, -100%)" }}
        >
          <span className="font-semibold tabular">{h.valor}</span>{" "}
          <span className="text-fg-muted">
            {h.periodo}
            {h.enCurso ? " · en curso" : ""}
          </span>
        </div>
      )}
      <table className="sr-only">
        <caption>Promedio por semestre</caption>
        <thead>
          <tr>
            <th scope="col">Semestre</th>
            <th scope="col">Promedio</th>
          </tr>
        </thead>
        <tbody>
          {serie.map((s) => (
            <tr key={s.periodo}>
              <th scope="row">{s.periodo}</th>
              <td>
                {s.valor}
                {s.enCurso ? " (en curso)" : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
