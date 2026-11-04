import type { Metadata } from "next";
import { Users } from "lucide-react";

import { requirePermission } from "@/authz/server";
import { CourseDot, EmptyState, PortProblem, type CourseSlot } from "@/design-system/components";
import { distribution } from "@/features/catedra/stats";
import { PageHead } from "@/features/servicios/page-head";
import { plural } from "@/features/shared/format";
import { cx } from "@/lib/cx";
import { withFault } from "@/lib/fault";
import { academic } from "@/modules/academic";
import { assessment, type SectionGradebook } from "@/modules/assessment";
import { requireActor } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Estadísticas" };

/** How each section is doing: spread of current grades and the average of every activity graded so far. */
export default async function EstadisticasPage() {
  await requirePermission("view_grade_stats", "grade");
  const actor = await requireActor();
  const sections = await withFault("academic", () => academic().listTeachingSections(actor));
  const books = sections.ok
    ? await Promise.all(
        sections.value.map((s) =>
          withFault("assessment", () => assessment().getSectionGradebook(actor, s.sectionId)),
        ),
      )
    : [];

  return (
    <div className="pb-10">
      <PageHead
        kicker={
          sections.ok
            ? `${plural(sections.value.length, "sección", "secciones")} · notas actuales`
            : "Cátedra"
        }
        title="Estadísticas"
      />
      {!sections.ok ? (
        <PortProblem
          error={sections.error}
          what="tus secciones"
          className="border-y border-border"
        />
      ) : sections.value.length === 0 ? (
        <div className="border-y border-border">
          <EmptyState
            icon={<Users aria-hidden="true" />}
            title="Sin secciones asignadas"
            description="Cuando la facultad te asigne una sección, verás cómo va aquí."
          />
        </div>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {sections.value.map((s, i) => {
            const book = books[i];
            return (
              <section key={s.sectionId} aria-labelledby={`est-${s.sectionId}`} className="py-8">
                <h2
                  id={`est-${s.sectionId}`}
                  className="flex items-center gap-2.5 display text-[26px] leading-tight font-medium md:text-[30px]"
                >
                  <CourseDot slot={s.slot as CourseSlot} />
                  {s.nombre} · {s.seccion}
                </h2>
                {!book?.ok ? (
                  book && <PortProblem error={book.error} what="las notas" className="mt-3" />
                ) : (
                  <SectionStats book={book.value} />
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionStats({ book }: { book: SectionGradebook }) {
  const evaluados = book.estudiantes.filter((e) => e.evaluado > 0);
  const bands = distribution(
    evaluados.map((e) => e.actual),
    book.umbral,
    book.metas,
  );
  const max = Math.max(1, ...bands.map((b) => b.count));
  const graded = book.actividades.filter((a) => a.promedio !== null);
  return (
    <>
      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-label">
        <div>
          <dt className="text-fg-muted">Estudiantes con nota</dt>
          <dd className="display text-[28px] leading-tight tabular">
            {evaluados.length} <span className="text-fg-muted">de {book.estudiantes.length}</span>
          </dd>
        </div>
        <div>
          <dt className="text-fg-muted">Promedio actual</dt>
          <dd className="display text-[28px] leading-tight tabular">{book.promedio.toFixed(1)}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">Bajo {book.umbral}</dt>
          <dd className="display text-[28px] leading-tight tabular">{book.bajoUmbral}</dd>
        </div>
      </dl>

      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <div>
          <h3 className="text-label font-semibold">
            Cómo se reparten las notas actuales (estudiantes)
          </h3>
          <ul className="mt-3 flex flex-col gap-2.5">
            {bands.map((b, i) => (
              <li
                key={b.id}
                className="grid grid-cols-[6rem_1fr_2.5rem] items-center gap-3 text-label"
              >
                <span className="tabular">{b.label}</span>
                <span aria-hidden="true" className="h-3 rounded-full bg-surface-subtle">
                  <span
                    className={cx("block h-3 rounded-full", i === 0 ? "bg-danger-fill" : "bg-fg")}
                    style={{ width: `${(b.count / max) * 100}%` }}
                  />
                </span>
                <span className="text-right font-semibold tabular">
                  {b.count}
                  <span className="sr-only"> {b.count === 1 ? "estudiante" : "estudiantes"}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-caption text-fg-muted">
            Umbral {book.umbral} y metas {book.metas.join("/")}: valores de ejemplo.
          </p>
        </div>
        <div>
          <h3 className="text-label font-semibold">Promedio por actividad</h3>
          {graded.length === 0 ? (
            <p className="mt-3 text-label text-fg-muted">Aún no hay actividades con nota.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2.5">
              {graded.map((a) => (
                <li
                  key={a.id}
                  className="grid grid-cols-[minmax(0,1fr)_7rem_3rem] items-center gap-3 text-label"
                >
                  <span className="truncate">{a.titulo}</span>
                  <span aria-hidden="true" className="h-3 rounded-full bg-surface-subtle">
                    <span
                      className="block h-3 rounded-full bg-fg"
                      style={{ width: `${a.promedio}%` }}
                    />
                  </span>
                  <span className="text-right font-semibold tabular">{a.promedio?.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
