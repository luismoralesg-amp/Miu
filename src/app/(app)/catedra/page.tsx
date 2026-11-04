import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";

import { requirePermission } from "@/authz/server";
import {
  buttonClasses,
  CourseDot,
  EmptyState,
  PortProblem,
  type CourseSlot,
} from "@/design-system/components";
import { scheduleLabel } from "@/features/cursos/table";
import { PageHead } from "@/features/servicios/page-head";
import { pendingWork } from "@/features/catedra/teaching";
import { plural, route } from "@/features/shared/format";
import { withFault } from "@/lib/fault";
import { academic } from "@/modules/academic";
import { assessment } from "@/modules/assessment";
import { requireActor } from "@/modules/identity/session";
import { closeGrantSections } from "@/modules/policy";

export const metadata: Metadata = { title: "Mis secciones" };

/** The sections the actor teaches or assists: who is in them, how they are doing and what is waiting. */
export default async function CatedraPage() {
  await requirePermission("grade");
  const actor = await requireActor();
  const sections = await withFault("academic", () => academic().listTeachingSections(actor));
  const books = sections.ok
    ? await Promise.all(
        sections.value.map((s) =>
          withFault("assessment", () => assessment().getSectionGradebook(actor, s.sectionId)),
        ),
      )
    : [];
  const rol = actor.role === "maestro" ? "Maestro" : "Auxiliar";
  const granted = closeGrantSections(actor);

  return (
    <div className="pb-10">
      <PageHead
        kicker={`${rol} · ${plural(sections.ok ? sections.value.length : 0, "sección", "secciones")} este período`}
        title="Mis secciones"
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
            description="Cuando la facultad te asigne una sección, aparecerá aquí."
          />
        </div>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {sections.value.map((s, i) => {
            const book = books[i];
            const pend = book?.ok ? pendingWork(book.value.actividades) : [];
            const porCalificar = pend.find((a) => a.estado === "por_calificar" && a.enLote);
            const equipo =
              s.rol === "catedratico"
                ? `Auxiliar: ${s.auxiliares.map((a) => a.nombre).join(", ") || "sin asignar"}`
                : `Catedrático: ${s.catedratico.nombre}`;
            return (
              <li key={s.sectionId} className="grid gap-5 py-7 md:grid-cols-[1fr_auto] md:gap-10">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2.5 display text-[26px] leading-tight font-medium md:text-[30px]">
                    <CourseDot slot={s.slot as CourseSlot} />
                    <Link
                      href={route(`/catedra/secciones/${s.sectionId}`)}
                      className="underline-offset-4 hover:underline"
                    >
                      {s.nombre} · {s.seccion}
                    </Link>
                  </h2>
                  <p className="mt-1.5 text-label text-fg-muted">
                    {scheduleLabel(s.horario)} · {s.horario.salon} ·{" "}
                    {plural(s.estudiantes, "estudiante", "estudiantes")} · {equipo}
                  </p>
                  {!book?.ok ? (
                    book && <PortProblem error={book.error} what="las notas" className="mt-3" />
                  ) : (
                    <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-label">
                      <div>
                        <dt className="text-fg-muted">Promedio actual</dt>
                        <dd className="display text-[28px] leading-tight tabular">
                          {book.value.promedio.toFixed(1)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-fg-muted">Bajo {book.value.umbral}</dt>
                        <dd className="display text-[28px] leading-tight tabular">
                          {book.value.bajoUmbral}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-fg-muted">Pendientes</dt>
                        <dd className="display text-[28px] leading-tight tabular">{pend.length}</dd>
                      </div>
                    </dl>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3 md:flex-col md:items-end md:justify-center">
                  {porCalificar && (
                    <Link
                      href={route(
                        `/catedra/por-calificar?seccion=${s.sectionId}&actividad=${porCalificar.id}`,
                      )}
                      className={buttonClasses({
                        variant: "ink",
                        pill: true,
                        className: "h-11 gap-2 px-5 text-[15px] font-semibold",
                      })}
                    >
                      Calificar {porCalificar.titulo}
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  )}
                  <span className="flex gap-5 text-label font-medium">
                    <Link
                      href={route(`/catedra/secciones/${s.sectionId}`)}
                      className="inline-flex min-h-11 items-center underline underline-offset-4"
                      aria-label={`Ver sección ${s.corto} ${s.seccion}`}
                    >
                      Ver sección
                    </Link>
                    <Link
                      href={route(`/catedra/libro/${s.sectionId}`)}
                      className="inline-flex min-h-11 items-center underline underline-offset-4"
                      aria-label={`Libro de notas de ${s.corto} ${s.seccion}`}
                    >
                      Libro de notas
                    </Link>
                    {granted.includes(s.sectionId) && (
                      <Link
                        href={route("/catedra/cierre")}
                        className="inline-flex min-h-11 items-center underline underline-offset-4"
                        aria-label={`Cerrar la nota final de ${s.corto} ${s.seccion}`}
                      >
                        Cerrar nota final
                      </Link>
                    )}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
