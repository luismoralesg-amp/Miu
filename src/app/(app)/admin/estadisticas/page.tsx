import type { Metadata } from "next";

import { requirePermission } from "@/authz/server";
import { CourseDot, PortProblem, type CourseSlot } from "@/design-system/components";
import { SectionStats } from "@/features/catedra/section-stats";
import { PageHead } from "@/features/servicios/page-head";
import { plural } from "@/features/shared/format";
import { withFault } from "@/lib/fault";
import { academic } from "@/modules/academic";
import { assessment } from "@/modules/assessment";
import { requireActor } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Estadísticas" };

/** How every section is doing, with the university-wide totals first. */
export default async function EstadisticasAdminPage() {
  await requirePermission("view_grade_stats", "configure_policy");
  const actor = await requireActor();
  const sections = await withFault("academic", () => academic().listTeachingSections(actor));
  const books = sections.ok
    ? await Promise.all(
        sections.value.map((s) =>
          withFault("assessment", () => assessment().getSectionGradebook(actor, s.sectionId)),
        ),
      )
    : [];
  const ok = books.flatMap((b) => (b.ok ? [b.value] : []));
  const evaluados = ok.flatMap((b) => b.estudiantes.filter((e) => e.evaluado > 0));
  const promedio = evaluados.length
    ? Math.round((evaluados.reduce((s, e) => s + e.actual, 0) / evaluados.length) * 10) / 10
    : 0;
  const bajo = ok.reduce((n, b) => n + b.bajoUmbral, 0);

  return (
    <div className="pb-10">
      <PageHead
        kicker={
          sections.ok
            ? `${plural(sections.value.length, "sección", "secciones")}`
            : "Administración"
        }
        title="Estadísticas"
      />
      {!sections.ok ? (
        <PortProblem
          error={sections.error}
          what="las secciones"
          className="border-y border-border"
        />
      ) : (
        <>
          <dl className="flex flex-wrap gap-x-10 gap-y-3 pb-8">
            <div>
              <dt className="text-label text-fg-muted">Inscripciones con nota</dt>
              <dd className="display text-[36px] leading-tight tabular">{evaluados.length}</dd>
            </div>
            <div>
              <dt className="text-label text-fg-muted">Promedio general</dt>
              <dd className="display text-[36px] leading-tight tabular">{promedio.toFixed(1)}</dd>
            </div>
            <div>
              <dt className="text-label text-fg-muted">Bajo el umbral</dt>
              <dd className="display text-[36px] leading-tight tabular">{bajo}</dd>
            </div>
          </dl>
          <div className="divide-y divide-border border-y border-border">
            {sections.value.map((s, i) => {
              const book = books[i];
              return (
                <section key={s.sectionId} aria-labelledby={`est-${s.sectionId}`} className="py-8">
                  <h2
                    id={`est-${s.sectionId}`}
                    className="flex flex-wrap items-center gap-x-2.5 display text-[26px] leading-tight font-medium md:text-[30px]"
                  >
                    <CourseDot slot={s.slot as CourseSlot} />
                    {s.nombre} · {s.seccion}
                    <span className="text-label font-normal text-fg-muted">
                      {s.catedratico.nombre}
                    </span>
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
        </>
      )}
    </div>
  );
}
