"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useId, useRef, useState } from "react";

import { CourseDot, type CourseSlot } from "@/design-system/components";
import { cx } from "@/lib/cx";
import type { CourseGrades } from "@/modules/assessment";

import { route, shortDate } from "../shared/format";
import { courseBar, goals, simulate } from "./model";

/**
 * One card per course: bar, targets and grade at a glance; open it for every grade and the
 * simulator. Opening is a CSS transition (interruptible, Escape closes it and returns focus).
 */
export function CourseCards({
  cursos,
  metas,
  umbral,
  abierto,
}: {
  cursos: CourseGrades[];
  metas: number[];
  umbral: number;
  abierto: string | null;
}) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(abierto ? [abierto] : []));
  const toggle = (id: string, value?: boolean) =>
    setOpen((s) => {
      const next = new Set(s);
      if (value ?? !next.has(id)) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <>
      <p
        className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-fg-muted"
        aria-hidden="true"
      >
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm bg-fg" />
          Obtenido
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm bg-border-strong" />
          Perdido
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm border border-border hatch" />
          Por evaluar
        </span>
      </p>
      <ul className="mt-4 divide-y divide-border border-y border-border">
        {cursos.map((c) => (
          <Card
            key={c.curso.id}
            c={c}
            metas={metas}
            umbral={umbral}
            open={open.has(c.curso.id)}
            onToggle={(v) => toggle(c.curso.id, v)}
          />
        ))}
      </ul>
    </>
  );
}

function Card({
  c,
  metas,
  umbral,
  open,
  onToggle,
}: {
  c: CourseGrades;
  metas: number[];
  umbral: number;
  open: boolean;
  onToggle: (value?: boolean) => void;
}) {
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const bar = courseBar(c);
  const g = goals(c, metas);
  const [x, setX] = useState(75);
  const sim = simulate(c, x, metas, umbral);
  const restante = 100 - c.evaluado;

  return (
    <li
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          onToggle(false);
          button.current?.focus();
        }
      }}
    >
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => onToggle()}
        className="flex w-full flex-col gap-2.5 py-5 text-left transition-colors duration-150 hover:bg-surface-subtle/60 md:-mx-3 md:w-[calc(100%+1.5rem)] md:rounded-lg md:px-3"
      >
        <span className="flex items-baseline justify-between gap-4">
          <span className="flex items-center gap-2 font-semibold">
            <CourseDot slot={c.curso.slot as CourseSlot} />
            {c.curso.nombre}
            {c.nuevas > 0 && (
              <span className="rounded-full bg-info-soft px-2 py-0.5 text-caption font-semibold text-info-fg">
                {c.nuevas} {c.nuevas === 1 ? "nueva" : "nuevas"}
              </span>
            )}
          </span>
          <span className="flex shrink-0 items-baseline gap-2 text-label">
            <span className="display text-[28px] leading-none tabular">{c.actual}</span>
            <span className="text-fg-muted">· {c.evaluado}%</span>
            <ChevronDown
              aria-hidden="true"
              className={cx(
                "size-4 self-center text-fg-muted transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </span>
        </span>
        <span
          role="img"
          aria-label={`Obtenido ${bar.obtenido} puntos, perdido ${bar.perdido}, por evaluar ${bar.porEvaluar}`}
          className="flex h-2 gap-0.5 overflow-hidden rounded-full"
        >
          <span className="rounded-l-full bg-fg" style={{ width: `${bar.obtenido}%` }} />
          <span className="bg-border-strong" style={{ width: `${bar.perdido}%` }} />
          <span className="flex-1 rounded-r-full hatch" />
        </span>
        <span className="flex flex-wrap gap-x-4 gap-y-1 text-label text-fg-muted tabular">
          {g.map((goal, i) =>
            goal.estado === "imposible" ? (
              <span key={goal.meta}>{goal.meta} ya no es alcanzable</span>
            ) : goal.estado === "asegurada" ? (
              <span key={goal.meta}>{goal.meta} asegurado</span>
            ) : (
              <span key={goal.meta}>
                {i === 0 ? `Para ${goal.meta} necesitas` : `para ${goal.meta},`}{" "}
                <b className="font-semibold text-fg">{goal.necesita}</b>
              </span>
            ),
          )}
        </span>
      </button>
      <div
        id={`${id}-panel`}
        role="region"
        aria-label={`Detalle de ${c.curso.nombre}`}
        className="expandable"
        // Closed panels leave the tab order and the accessibility tree, not just the screen.
        inert={!open}
      >
        <div>
          <div className="grid gap-8 pt-2 pb-8 md:grid-cols-12">
            <div className="md:col-span-8">
              <p className="text-label text-fg-muted">
                Catedrático: {c.catedratico}
                {c.auxiliar && ` · Auxiliar: ${c.auxiliar}`}
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-label tabular">
                  <caption className="sr-only">Notas de {c.curso.nombre}</caption>
                  <thead className="text-caption text-fg-muted">
                    <tr className="border-b border-border">
                      <th scope="col" className="py-2.5 pr-4 font-medium">
                        Actividad
                      </th>
                      <th scope="col" className="py-2.5 pr-4 text-right font-medium">
                        Peso
                      </th>
                      <th scope="col" className="py-2.5 pr-4 text-right font-medium">
                        Nota
                      </th>
                      <th scope="col" className="py-2.5 pr-4 font-medium">
                        Calificó
                      </th>
                      <th scope="col" className="py-2.5 font-medium">
                        Fecha
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {c.filas.map((f) => (
                      <tr key={f.activityId} className={cx(f.nota === null && "text-fg-muted")}>
                        <th scope="row" className="py-3 pr-4 font-medium">
                          <Link
                            href={route(`/cursos/${c.curso.id}/actividades/${f.activityId}`)}
                            className="underline-offset-4 hover:underline"
                          >
                            {f.titulo}
                          </Link>
                          {f.nueva && (
                            <span className="ml-2 rounded-full bg-info-soft px-2 py-0.5 text-caption font-semibold text-info-fg">
                              Nueva
                            </span>
                          )}
                        </th>
                        <td className="py-3 pr-4 text-right">{f.peso}%</td>
                        <td className="py-3 pr-4 text-right font-semibold">{f.nota ?? "—"}</td>
                        <td className="py-3 pr-4">{f.por ?? "Pendiente"}</td>
                        <td className="py-3">{shortDate(f.fecha)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <section
              aria-labelledby={`${id}-sim`}
              className="md:col-span-4 md:border-l md:border-border md:pl-8"
            >
              <h3 id={`${id}-sim`} className="display text-[24px] font-medium">
                ¿Qué nota necesito?
              </h3>
              <p className="mt-1 text-label text-fg-muted">Falta el {restante}% del curso</p>
              <label
                htmlFor={`${id}-x`}
                className="mt-5 flex items-baseline justify-between text-label"
              >
                <span className="text-fg-muted">Si en lo que falta saco</span>
                <output htmlFor={`${id}-x`} className="display text-[28px] tabular">
                  {x}
                </output>
              </label>
              <input
                id={`${id}-x`}
                type="range"
                min={0}
                max={100}
                value={x}
                onChange={(e) => setX(Number(e.target.value))}
                className="mt-2 h-11 w-full cursor-pointer accent-[var(--fg)]"
              />
              <p className="mt-3 text-label text-fg-muted">Terminaría con</p>
              <p className="display text-[56px] leading-none tabular" aria-live="polite">
                {sim.final}
              </p>
              <p className="mt-2 text-[15px]" aria-live="polite">
                {sim.nota}
              </p>
            </section>
          </div>
        </div>
      </div>
    </li>
  );
}
