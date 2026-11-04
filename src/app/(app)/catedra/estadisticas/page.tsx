import type { Metadata } from "next";
import { Users } from "lucide-react";

import { requirePermission } from "@/authz/server";
import { CourseDot, EmptyState, PortProblem, type CourseSlot } from "@/design-system/components";
import { SectionStats } from "@/features/catedra/section-stats";
import { PageHead } from "@/features/servicios/page-head";
import { plural } from "@/features/shared/format";
import { withFault } from "@/lib/fault";
import { academic } from "@/modules/academic";
import { assessment } from "@/modules/assessment";
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
