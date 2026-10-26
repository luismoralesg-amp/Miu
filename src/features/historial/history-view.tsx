"use client";

import { Search, SearchX } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/design-system/components";
import type { PastCourse } from "@/modules/academic";

import { groupByTerm, searchHistory } from "./history";

/** Past terms with one search over all of them. */
export function HistoryView({ courses }: { courses: PastCourse[] }) {
  const [q, setQ] = useState("");
  const terms = groupByTerm(searchHistory(courses, q));
  const n = terms.reduce((s, t) => s + t.cursos.length, 0);
  return (
    <div>
      <div className="flex flex-col gap-3 pb-8 sm:flex-row sm:items-center">
        <label className="relative flex-1 sm:max-w-md">
          <span className="sr-only">Buscar en tu historial</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-fg-muted"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Curso, código o período"
            className="h-12 w-full rounded-full border border-border-control bg-surface pr-4 pl-11 text-body placeholder:text-fg-muted"
          />
        </label>
        <p role="status" aria-live="polite" className="text-label text-fg-muted sm:ml-auto">
          {n} {n === 1 ? "curso" : "cursos"}
        </p>
      </div>
      {n === 0 ? (
        <div className="border-y border-border">
          <EmptyState
            icon={<SearchX aria-hidden="true" />}
            title={`Nada coincide con “${q.trim()}”`}
            description="Prueba con el nombre del curso, su código o el período (2025-1)."
          />
        </div>
      ) : (
        terms.map((t) => (
          <section key={t.periodo} aria-labelledby={`t-${t.periodo}`} className="pb-10">
            <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3">
              <h2 id={`t-${t.periodo}`} className="display text-[28px] font-medium">
                {t.periodo}
              </h2>
              <p className="text-label text-fg-muted tabular">
                Promedio <b className="font-semibold text-fg">{t.promedio}</b> · {t.uma} UMA
              </p>
            </div>
            <div
              className="overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label={`Cursos de ${t.periodo}`}
            >
              <table className="w-full min-w-[520px] text-left text-[15px] tabular">
                <caption className="sr-only">Cursos de {t.periodo}</caption>
                <thead className="text-caption text-fg-muted">
                  <tr className="border-y border-border">
                    <th scope="col" className="w-28 py-3 pr-4 font-medium">
                      Código
                    </th>
                    <th scope="col" className="py-3 pr-4 font-medium">
                      Curso
                    </th>
                    <th scope="col" className="w-24 py-3 pr-4 font-medium">
                      Sección
                    </th>
                    <th scope="col" className="w-20 py-3 pr-4 text-right font-medium">
                      UMA
                    </th>
                    <th scope="col" className="w-20 py-3 text-right font-medium">
                      Nota
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {t.cursos.map((c) => (
                    <tr key={c.codigo}>
                      <td className="py-3 pr-4 text-fg-muted">{c.codigo}</td>
                      <th scope="row" className="py-3 pr-4 font-medium">
                        {c.nombre}
                      </th>
                      <td className="py-3 pr-4">{c.seccion}</td>
                      <td className="py-3 pr-4 text-right">{c.uma}</td>
                      <td className="py-3 text-right font-semibold">{c.nota}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
