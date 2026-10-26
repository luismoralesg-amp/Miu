"use client";

import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import { CourseDot } from "@/design-system/components";
import { cx } from "@/lib/cx";
import type { Pensum, PensumCourse } from "@/modules/curriculum";

import { route } from "../shared/format";
import { AREA_SLOT, bySemester, relations } from "./graph";

const STATUS: Record<PensumCourse["estado"], string> = {
  aprobado: "Aprobado",
  en_curso: "En curso",
  disponible: "Disponible",
  bloqueado: "Bloqueado",
};

type Edge = { d: string; tipo: "requisito" | "abre" };

/**
 * The curriculum as a graph: columns are semesters, color marks the area. Selecting a course outlines
 * everything it needs and everything it opens, and draws its direct links. Selection is instant
 * (no animation); the detail is announced to screen readers.
 */
export function PensumGraph({ pensum }: { pensum: Pensum }) {
  const [selected, setSelected] = useState<string | null>(null);
  const { rel, directos } = relations(pensum.cursos, selected);
  const sel = pensum.cursos.find((c) => c.codigo === selected) ?? null;
  const name = (code: string) => pensum.cursos.find((c) => c.codigo === code)?.nombre ?? code;
  const box = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, HTMLButtonElement>());
  const [edges, setEdges] = useState<Edge[]>([]);

  // Edges are measured from the laid-out nodes, so they are drawn after layout and on resize.
  useLayoutEffect(() => {
    const root = box.current;
    const draw = () => {
      if (!root || !selected) return setEdges([]);
      const r = root.getBoundingClientRect();
      const at = (code: string) => {
        const el = nodes.current.get(`desk:${code}`);
        if (!el || el.offsetParent === null) return null;
        const b = el.getBoundingClientRect();
        return {
          l: b.left - r.left + root.scrollLeft,
          rgt: b.right - r.left + root.scrollLeft,
          y: b.top - r.top + b.height / 2,
        };
      };
      const curve = (from: string, to: string, tipo: Edge["tipo"]): Edge | null => {
        const a = at(from);
        const b = at(to);
        if (!a || !b) return null;
        const mid = (a.rgt + b.l) / 2;
        return { d: `M${a.rgt},${a.y} C${mid},${a.y} ${mid},${b.y} ${b.l},${b.y}`, tipo };
      };
      const { directos: d } = relations(pensum.cursos, selected);
      setEdges(
        [
          ...d.requisitos.map((p) => curve(p, selected, "requisito")),
          ...d.abre.map((n) => curve(selected, n, "abre")),
        ].filter((e): e is Edge => e !== null),
      );
    };
    draw();
    const ro = new ResizeObserver(draw);
    if (root) ro.observe(root);
    return () => ro.disconnect();
  }, [selected, pensum.cursos]);

  const semesters = bySemester(pensum.cursos);
  const node = (c: PensumCourse, view: "desk" | "phone") => {
    const r = rel.get(c.codigo) ?? null;
    return (
      <button
        key={c.codigo}
        ref={(el) => {
          if (el) nodes.current.set(`${view}:${c.codigo}`, el);
        }}
        type="button"
        aria-pressed={selected === c.codigo}
        onClick={() => setSelected((s) => (s === c.codigo ? null : c.codigo))}
        className={cx(
          "relative z-10 flex w-full flex-col gap-1 rounded-lg px-2.5 py-2 text-left transition-colors duration-150",
          r === "seleccionado"
            ? "border-2 border-fg bg-surface"
            : r === "requisito"
              ? "border border-fg bg-surface"
              : r === "abre"
                ? "border border-dashed border-fg bg-surface"
                : c.estado === "bloqueado"
                  ? "border border-border bg-bg hover:bg-surface-subtle"
                  : "border border-border bg-surface hover:bg-surface-subtle",
        )}
      >
        <span className="flex items-center justify-between gap-1 text-caption whitespace-nowrap text-fg-muted tabular">
          <span className="flex items-center gap-1.5">
            <CourseDot slot={AREA_SLOT[c.area] ?? 5} />
            {c.codigo}
          </span>
          <span>{c.uma} UMA</span>
        </span>
        <span
          className={cx(
            "text-label leading-snug font-semibold",
            c.estado === "bloqueado" && "text-fg-muted",
          )}
        >
          {c.nombre}
        </span>
        <span className="flex items-center gap-1 text-caption whitespace-nowrap">
          {c.estado === "aprobado" ? (
            <>
              <Check aria-hidden="true" className="size-3.5 text-success-fg" />
              <span className="text-success-fg">
                Aprobado{c.nota !== undefined ? ` · ${c.nota}` : ""}
              </span>
            </>
          ) : c.estado === "en_curso" ? (
            <span className="font-semibold">En curso</span>
          ) : c.estado === "bloqueado" ? (
            <>
              <Lock aria-hidden="true" className="size-3.5 text-fg-muted" />
              <span className="text-fg-muted">Bloqueado</span>
            </>
          ) : (
            <span className="text-fg-muted">Disponible</span>
          )}
        </span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div
        className="flex flex-wrap items-center gap-x-5 gap-y-2 text-label text-fg-muted"
        aria-label="Leyenda"
      >
        {pensum.areas.map((a) => (
          <span key={a.id} className="flex items-center gap-1.5">
            <CourseDot slot={AREA_SLOT[a.id] ?? 5} />
            {a.nombre}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-sm border border-fg" />
          Requisito
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-sm border border-dashed border-fg" />
          Lo abre
        </span>
      </div>

      <section
        aria-live="polite"
        aria-label="Curso seleccionado"
        className="min-h-[88px] rounded-[16px] border border-border bg-surface px-5 py-4 text-[15px]"
      >
        {sel ? (
          <div className="flex flex-col gap-1">
            <p>
              <b className="font-semibold">{sel.nombre}</b>{" "}
              <span className="text-fg-muted">
                · {sel.codigo} · {sel.uma} UMA · {STATUS[sel.estado]}
                {sel.nota !== undefined ? ` con ${sel.nota} (${sel.periodo})` : ""}
              </span>
              {sel.cursoActual && (
                <>
                  {" "}
                  ·{" "}
                  <Link
                    href={route(`/cursos/${sel.cursoActual}`)}
                    className="underline underline-offset-4"
                  >
                    ir al curso
                  </Link>
                </>
              )}
            </p>
            <p className="text-fg-muted">
              {sel.prerrequisitos.length
                ? `Necesita ${sel.prerrequisitos.map(name).join(" y ")}`
                : "No tiene prerrequisitos"}
              {[...rel.values()].filter((v) => v === "requisito").length >
                sel.prerrequisitos.length &&
                ` (${[...rel.values()].filter((v) => v === "requisito").length} cursos en la cadena)`}
              {". "}
              {directos.abre.length
                ? `Abre ${directos.abre.map(name).join(", ")}.`
                : "No abre otros cursos."}
            </p>
          </div>
        ) : (
          <p className="text-fg-muted">
            Toca un curso para ver qué necesita y qué abre. La cadena completa queda marcada en el
            mapa.
          </p>
        )}
      </section>

      <div
        ref={box}
        className="relative hidden overflow-x-auto pb-2 lg:block"
        tabIndex={0}
        role="region"
        aria-label="Mapa del pensum por semestre"
      >
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
        >
          {edges.map((e, i) => (
            <path
              key={i}
              d={e.d}
              fill="none"
              stroke="var(--fg)"
              strokeWidth="1.5"
              strokeDasharray={e.tipo === "abre" ? "4 4" : undefined}
            />
          ))}
        </svg>
        <ol className="grid min-w-[1040px] grid-cols-8 gap-3">
          {semesters.map((s) => (
            <li key={s.semestre} className="flex flex-col gap-3">
              <h2
                className={cx(
                  "border-b border-border pb-2 text-label",
                  s.semestre === pensum.semestreActual ? "font-semibold text-fg" : "text-fg-muted",
                )}
              >
                Semestre {s.semestre}
                {s.semestre === pensum.semestreActual && " · actual"}
              </h2>
              <ul className="flex flex-col gap-3">
                {s.cursos.map((c) => (
                  <li key={c.codigo}>{node(c, "desk")}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>

      <ol className="flex flex-col gap-8 lg:hidden">
        {semesters.map((s) => (
          <li key={s.semestre}>
            <h2
              className={cx(
                "border-b border-border pb-2 text-[15px]",
                s.semestre === pensum.semestreActual && "font-semibold",
              )}
            >
              Semestre {s.semestre}
              {s.semestre === pensum.semestreActual && " · actual"}
            </h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {s.cursos.map((c) => (
                <li key={c.codigo}>{node(c, "phone")}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
