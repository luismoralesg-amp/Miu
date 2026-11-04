import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Lock, Users } from "lucide-react";

import {
  Badge,
  CourseDot,
  EmptyState,
  PortProblem,
  type CourseSlot,
} from "@/design-system/components";
import { CloseForm } from "@/features/catedra/close-form";
import { progressLabel, STATUS } from "@/features/catedra/teaching";
import { PageHead } from "@/features/servicios/page-head";
import { plural, route } from "@/features/shared/format";
import { withFault } from "@/lib/fault";
import { academic } from "@/modules/academic";
import { assessment, closeReadiness } from "@/modules/assessment";
import { requireActor } from "@/modules/identity/session";
import { closeGrantSections } from "@/modules/policy";

import { cerrarNotaFinal } from "./actions";

export const metadata: Metadata = { title: "Cerrar nota final" };

/** Closing the final grade of each section: what still blocks it, what won't count, and the close itself. */
export default async function CierrePage() {
  const actor = await requireActor();
  // The Maestro by default [S]; an Auxiliar only for the sections the Administrativo granted them.
  const granted = closeGrantSections(actor);
  if (actor.role !== "maestro" && granted.length === 0) notFound();
  const all = await withFault("academic", () => academic().listTeachingSections(actor));
  const sections = all.ok
    ? {
        ...all,
        value: all.value.filter((s) => actor.role === "maestro" || granted.includes(s.sectionId)),
      }
    : all;
  const books = sections.ok
    ? await Promise.all(
        sections.value.map((s) =>
          withFault("assessment", () => assessment().getSectionGradebook(actor, s.sectionId)),
        ),
      )
    : [];
  const abiertas = books.filter((b) => b.ok && !b.value.cerrada).length;

  return (
    <div className="pb-10">
      <PageHead
        kicker={
          sections.ok
            ? abiertas === 0
              ? "Todas las secciones están cerradas"
              : `${plural(abiertas, "sección abierta", "secciones abiertas")}`
            : "Cátedra"
        }
        title="Cerrar nota final"
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
            description="Cuando la facultad te asigne una sección, podrás cerrar su nota final aquí."
          />
        </div>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {sections.value.map((s, i) => {
            const book = books[i];
            const ready = book?.ok ? closeReadiness(book.value.actividades) : null;
            return (
              <li
                key={s.sectionId}
                aria-labelledby={`cierre-${s.sectionId}`}
                className="grid gap-6 py-8 md:grid-cols-[1fr_minmax(0,22rem)] md:gap-12"
              >
                <div className="min-w-0">
                  <h2
                    id={`cierre-${s.sectionId}`}
                    className="flex flex-wrap items-center gap-2.5 display text-[26px] leading-tight font-medium md:text-[30px]"
                  >
                    <CourseDot slot={s.slot as CourseSlot} />
                    {s.nombre} · {s.seccion}
                    {book?.ok && book.value.cerrada && (
                      <Badge tone="success" icon={<Lock aria-hidden="true" />}>
                        Cerrada
                      </Badge>
                    )}
                  </h2>
                  {!book?.ok ? (
                    book && <PortProblem error={book.error} what="las notas" className="mt-3" />
                  ) : (
                    <>
                      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-label">
                        <div>
                          <dt className="text-fg-muted">Estudiantes</dt>
                          <dd className="display text-[28px] leading-tight tabular">
                            {book.value.estudiantes.length}
                          </dd>
                        </div>
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
                      </dl>
                      <Link
                        href={route(`/catedra/libro/${s.sectionId}`)}
                        className="mt-3 inline-flex min-h-11 items-center text-label font-medium underline underline-offset-4"
                        aria-label={`Revisar el libro de notas de ${s.corto} ${s.seccion}`}
                      >
                        Revisar el libro de notas
                      </Link>
                    </>
                  )}
                </div>
                <div className="min-w-0">
                  {book?.ok && ready && (
                    <>
                      {ready.bloqueos.length > 0 && !book.value.cerrada ? (
                        <>
                          <h3 className="text-label font-semibold">Antes de cerrar</h3>
                          <ul className="mt-2 divide-y divide-border border-y border-border">
                            {ready.bloqueos.map((a) => (
                              <li
                                key={a.id}
                                className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3"
                              >
                                <span className="font-medium">{a.titulo}</span>
                                <Badge tone={STATUS[a.estado].tone}>{STATUS[a.estado].label}</Badge>
                                <span className="basis-full text-label text-fg-muted">
                                  {progressLabel(a, book.value.estudiantes.length)}
                                </span>
                              </li>
                            ))}
                          </ul>
                          <p className="mt-3 text-label text-fg-muted">
                            Califica y publica lo que falta; después podrás cerrar.
                          </p>
                          <span className="mt-1 flex gap-5 text-label font-medium">
                            <Link
                              href={route("/catedra/por-calificar")}
                              className="inline-flex min-h-11 items-center underline underline-offset-4"
                            >
                              Ir a Por calificar
                            </Link>
                            <Link
                              href={route("/catedra/publicar")}
                              className="inline-flex min-h-11 items-center underline underline-offset-4"
                            >
                              Ir a Publicar
                            </Link>
                          </span>
                        </>
                      ) : (
                        <CloseForm
                          sectionId={s.sectionId}
                          nombre={`${s.nombre} ${s.seccion}`}
                          programadas={ready.programadas.map((a) => a.titulo)}
                          cerrada={book.value.cerrada}
                          action={cerrarNotaFinal}
                        />
                      )}
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
