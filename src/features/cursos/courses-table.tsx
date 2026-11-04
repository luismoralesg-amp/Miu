"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SearchX, X } from "lucide-react";
import { useMemo, useState } from "react";

import { CourseDot, EmptyState, type CourseSlot } from "@/design-system/components";
import { cx } from "@/lib/cx";

import { dueLabel, plural, route } from "../shared/format";
import {
  filterCourses,
  groupCourses,
  sortCourses,
  sortKeys,
  sortLabel,
  type CourseRow,
  type SortKey,
} from "./table";

/**
 * Search and sort run on the client over the student's few courses (no round trip, so it answers as
 * fast as you type) and are mirrored in the URL, so a filtered view can be shared or bookmarked.
 */
export function CoursesTable({ rows, now }: { rows: CourseRow[]; now: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const initialSort = params.get("orden");
  const [orden, setOrden] = useState<SortKey>(
    sortKeys.includes(initialSort as SortKey) ? (initialSort as SortKey) : "nombre",
  );
  const ahora = useMemo(() => new Date(now), [now]);

  const sync = (nextQ: string, nextOrden: SortKey) => {
    const sp = new URLSearchParams();
    if (nextQ.trim()) sp.set("q", nextQ.trim());
    if (nextOrden !== "nombre") sp.set("orden", nextOrden);
    const qs = sp.toString();
    router.replace(route(qs ? `${pathname}?${qs}` : pathname), { scroll: false });
  };

  const visible = sortCourses(filterCourses(rows, q), orden);
  const groups = groupCourses(visible);

  return (
    <div>
      <div className="flex flex-col gap-3 pb-8 sm:flex-row sm:items-center">
        <label className="relative flex-1 sm:max-w-md">
          <span className="sr-only">Buscar en tus cursos</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-fg-muted"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              sync(e.target.value, orden);
            }}
            placeholder="Curso, catedrático, sección o salón"
            className="h-12 w-full rounded-full border border-border-control bg-surface pr-4 pl-11 text-body placeholder:text-fg-muted focus-visible:outline-2 focus-visible:outline-offset-2"
          />
        </label>
        <label className="flex items-center gap-2 text-label text-fg-muted">
          Ordenar por
          <select
            value={orden}
            onChange={(e) => {
              const v = e.target.value as SortKey;
              setOrden(v);
              sync(q, v);
            }}
            className="h-12 rounded-full border border-border-control bg-surface px-4 text-body text-fg"
          >
            {sortKeys.map((k) => (
              <option key={k} value={k}>
                {sortLabel[k]}
              </option>
            ))}
          </select>
        </label>
        <p className="text-label text-fg-muted sm:ml-auto" role="status" aria-live="polite">
          {q.trim()
            ? `${plural(visible.length, "curso coincide", "cursos coinciden")}`
            : plural(rows.length, "curso", "cursos")}
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="border-y border-border">
          <EmptyState
            icon={<SearchX aria-hidden="true" />}
            title={`Ningún curso coincide con “${q.trim()}”`}
            description="Prueba con el nombre corto del curso, el apellido de tu catedrático o “sección A”."
            action={
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  sync("", orden);
                }}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border-strong px-4 text-label font-medium"
              >
                <X aria-hidden="true" className="size-4" />
                Limpiar búsqueda
              </button>
            }
          />
        </div>
      ) : (
        groups.map((g, gi) => (
          <section
            key={`${g.facultad}-${g.periodo}`}
            aria-labelledby={`grupo-${gi}`}
            className="pb-10"
          >
            <h2
              id={`grupo-${gi}`}
              className="flex flex-col gap-1 pb-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
            >
              <span className="display text-[24px] font-medium md:text-[28px]">{g.facultad}</span>
              <span className="text-label whitespace-nowrap text-fg-muted">
                Semestre {g.periodo}
              </span>
            </h2>
            <table className="hidden w-full table-fixed border-t border-border text-left text-[15px] md:table">
              <caption className="sr-only">
                Cursos de {g.facultad}, semestre {g.periodo}, ordenados por{" "}
                {sortLabel[orden].toLowerCase()}
              </caption>
              <colgroup>
                <col className="w-[30%]" />
                <col className="w-[19%]" />
                <col className="w-[20%]" />
                <col className="w-[11%]" />
                <col className="w-[20%]" />
              </colgroup>
              <thead className="text-caption text-fg-muted">
                <tr className="border-b border-border">
                  <th
                    scope="col"
                    className="py-3 pr-4 font-medium"
                    aria-sort={orden === "nombre" ? "ascending" : undefined}
                  >
                    Curso
                  </th>
                  <th scope="col" className="py-3 pr-4 font-medium">
                    Catedrático
                  </th>
                  <th scope="col" className="py-3 pr-4 font-medium">
                    Horario
                  </th>
                  <th
                    scope="col"
                    className="py-3 pr-4 text-right font-medium"
                    aria-sort={orden === "nota" ? "descending" : undefined}
                  >
                    Nota actual
                  </th>
                  <th
                    scope="col"
                    className="py-3 pl-6 font-medium"
                    aria-sort={orden === "proxima" ? "ascending" : undefined}
                  >
                    Próxima entrega
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {g.rows.map((r) => (
                  <tr
                    key={r.id}
                    className="group relative transition-colors duration-150 hover:bg-surface-subtle"
                  >
                    <th scope="row" className="py-4 pr-4 font-normal">
                      <Link
                        href={route(`/cursos/${r.id}`)}
                        className="flex flex-col rounded-sm after:absolute after:inset-0"
                      >
                        <span className="flex items-center gap-2 font-semibold group-hover:underline group-hover:underline-offset-4">
                          <CourseDot slot={r.slot as CourseSlot} />
                          {r.nombre}
                        </span>
                        <span className="pl-4 text-label text-fg-muted">
                          Sección {r.seccion} · {plural(r.creditos, "crédito", "créditos")}
                        </span>
                      </Link>
                    </th>
                    <td className="py-4 pr-4">
                      {r.catedratico}
                      {r.auxiliar && (
                        <span className="block text-label text-fg-muted">
                          Auxiliar: {r.auxiliar}
                        </span>
                      )}
                    </td>
                    <td className="py-4 pr-4 text-label">
                      {r.horario}
                      <span className="block text-fg-muted">{r.salon}</span>
                    </td>
                    <td className="py-4 pr-4 text-right">
                      {r.nota === null ? (
                        <span className="text-fg-muted">—</span>
                      ) : (
                        <>
                          <span className="display text-[26px] tabular">{r.nota}</span>
                          <span className="block text-caption text-fg-muted">
                            sobre {r.evaluado}%
                          </span>
                        </>
                      )}
                    </td>
                    <td className="py-4 pl-6 text-label">
                      {r.proxima ? (
                        <>
                          <span className="font-medium">{r.proxima.titulo}</span>
                          <span className="block text-fg-muted">
                            {dueLabel(r.proxima.fecha, ahora)}
                          </span>
                        </>
                      ) : (
                        <span className="text-fg-muted">Nada pendiente</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="divide-y divide-border border-t border-border md:hidden">
              {g.rows.map((r) => (
                <li key={r.id}>
                  <Link
                    href={route(`/cursos/${r.id}`)}
                    className="flex items-start justify-between gap-4 py-4"
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 font-semibold">
                        <CourseDot slot={r.slot as CourseSlot} />
                        {r.nombre}
                      </span>
                      <span className="block pl-4 text-label text-fg-muted">
                        {r.catedratico} · Sección {r.seccion}
                      </span>
                      <span className="block pl-4 text-label text-fg-muted">
                        {r.proxima
                          ? `${r.proxima.titulo} · ${dueLabel(r.proxima.fecha, ahora)}`
                          : "Nada pendiente"}
                      </span>
                    </span>
                    <span className={cx("shrink-0 text-right", r.nota === null && "text-fg-muted")}>
                      <span className="block display text-[26px] leading-none tabular">
                        {r.nota ?? "—"}
                      </span>
                      {r.nota !== null && (
                        <span className="text-caption text-fg-muted">sobre {r.evaluado}%</span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
