import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { requirePermission } from "@/authz/server";
import { Badge, CourseDot, PortProblem, type CourseSlot } from "@/design-system/components";
import { pendingWork, progressLabel, STATUS } from "@/features/catedra/teaching";
import { scheduleLabel } from "@/features/cursos/table";
import { SectionTitle } from "@/features/hoy/sections";
import { cap, plural, route, shortDate } from "@/features/shared/format";
import { withFault } from "@/lib/fault";
import { academic } from "@/modules/academic";
import { assessment } from "@/modules/assessment";
import { requireActor } from "@/modules/identity/session";

type Props = { params: Promise<{ seccionId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seccionId } = await params;
  const sections = await academic().listTeachingSections(await requireActor());
  const s = sections.ok ? sections.value.find((x) => x.sectionId === seccionId) : undefined;
  return { title: s ? `${s.corto} ${s.seccion}` : "Sección" };
}

/** One section: what is waiting first, then every activity, the students and the teaching team. */
export default async function SeccionPage({ params }: Props) {
  await requirePermission("grade");
  const actor = await requireActor();
  const { seccionId } = await params;
  const sections = await withFault("academic", () => academic().listTeachingSections(actor));
  if (!sections.ok)
    return (
      <PortProblem
        error={sections.error}
        what="la sección"
        className="mt-10 border-y border-border"
      />
    );
  // Not one of the actor's sections: the same 404 as a section that does not exist.
  const s = sections.value.find((x) => x.sectionId === seccionId);
  if (!s) notFound();
  const [book, roster] = await Promise.all([
    withFault("assessment", () => assessment().getSectionGradebook(actor, seccionId)),
    withFault("academic", () => academic().getRoster(actor, seccionId)),
  ]);
  const actual = new Map(
    book.ok ? book.value.estudiantes.map((e) => [e.studentId, e] as const) : [],
  );
  const pend = book.ok ? pendingWork(book.value.actividades) : [];

  return (
    <div className="pb-10">
      <Link
        href="/catedra"
        className="mt-8 inline-flex min-h-11 items-center gap-1.5 text-label font-medium text-fg-muted transition-colors duration-150 hover:text-fg md:mt-10"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Mis secciones
      </Link>
      <section className="reveal pt-2 pb-8">
        <p className="flex flex-wrap items-center gap-1.5 text-[15px] text-fg-muted">
          <CourseDot slot={s.slot as CourseSlot} />
          Sección {s.seccion} · {scheduleLabel(s.horario)} · {s.horario.salon}
        </p>
        <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium md:text-[56px]">
          {s.nombre}
        </h1>
        <div className="mt-5 flex flex-wrap gap-x-5 text-label font-medium">
          <Link
            href={route(`/catedra/libro/${s.sectionId}`)}
            className="inline-flex min-h-11 items-center underline underline-offset-4"
          >
            Libro de notas
          </Link>
          <Link
            href={route(`/cursos/${s.courseId}`)}
            className="inline-flex min-h-11 items-center underline underline-offset-4"
          >
            Página del curso
          </Link>
        </div>
      </section>

      {pend.length > 0 && (
        <section
          aria-labelledby="pend-t"
          className="reveal rounded-[20px] border border-border bg-surface px-6 py-5 md:px-8"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <h2 id="pend-t" className="font-semibold">
            {plural(pend.length, "actividad espera", "actividades esperan")}
          </h2>
          <ul className="mt-2 divide-y divide-border">
            {pend.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3"
              >
                <span>
                  <span className="font-medium">{a.titulo}</span>
                  <span className="text-label text-fg-muted">
                    {" "}
                    · cerró el {shortDate(a.fecha)} · {progressLabel(a, s.estudiantes)}
                  </span>
                </span>
                {a.enLote && (
                  <Link
                    href={route(`/catedra/por-calificar?seccion=${s.sectionId}&actividad=${a.id}`)}
                    className="inline-flex min-h-11 items-center gap-1 text-label font-semibold underline underline-offset-4"
                  >
                    {a.estado === "por_calificar" ? "Calificar" : "Revisar y publicar"}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="act-t" className="py-10">
        <SectionTitle id="act-t">Actividades</SectionTitle>
        {!book.ok ? (
          <PortProblem error={book.error} what="las actividades" className="mt-4" />
        ) : (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {book.value.actividades.map((a) => (
              <li
                key={a.id}
                className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3.5 sm:grid-cols-[1fr_8rem_9rem_5rem]"
              >
                <span className="min-w-0">
                  <span className="block font-medium">{a.titulo}</span>
                  <span className="text-label text-fg-muted">
                    {cap(a.tipo)} · {a.peso} % · {shortDate(a.fecha)}
                  </span>
                </span>
                <Badge
                  tone={STATUS[a.estado].tone}
                  className="justify-self-end sm:justify-self-start"
                >
                  {STATUS[a.estado].label}
                </Badge>
                <span className="col-span-2 text-label text-fg-muted sm:col-span-1">
                  {progressLabel(a, s.estudiantes)}
                </span>
                <span className="hidden text-right text-label tabular sm:block">
                  {a.promedio === null ? (
                    <span className="text-fg-muted">—</span>
                  ) : (
                    <>
                      <span className="sr-only">Promedio </span>
                      {a.promedio.toFixed(1)}
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-10 md:grid-cols-12 md:gap-0 md:divide-x md:divide-border">
        <section aria-labelledby="est-t" className="md:col-span-8 md:pr-12">
          <SectionTitle id="est-t">
            {plural(s.estudiantes, "estudiante", "estudiantes")}
          </SectionTitle>
          {!roster.ok ? (
            <PortProblem error={roster.error} what="la lista de estudiantes" className="mt-4" />
          ) : (
            <ul
              aria-label="Estudiantes"
              className="mt-4 divide-y divide-border border-y border-border"
            >
              {roster.value.map((r) => {
                const row = actual.get(r.personId);
                const bajo = book.ok && row && row.evaluado > 0 && row.actual < book.value.umbral;
                return (
                  <li key={r.personId} className="flex items-center justify-between gap-4 py-3">
                    <span className="min-w-0">
                      <span className="block font-medium">{r.nombre}</span>
                      <span className="text-caption text-fg-muted tabular">
                        {r.carne} · {r.correo}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-4">
                      {row && row.evaluado > 0 && (
                        <span
                          className={
                            bajo
                              ? "text-label font-semibold text-danger-fg tabular"
                              : "text-label tabular"
                          }
                        >
                          {row.actual.toFixed(1)}
                          {bajo && <span className="sr-only"> (bajo el umbral)</span>}
                        </span>
                      )}
                      <Link
                        href={route(`/comunicacion?con=${r.personId}`)}
                        className="inline-flex min-h-11 items-center text-label font-medium underline underline-offset-4"
                        aria-label={`Escribir a ${r.nombre}`}
                      >
                        Escribir
                      </Link>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section aria-labelledby="eq-t" className="md:col-span-4 md:pl-12">
          <SectionTitle id="eq-t">Equipo</SectionTitle>
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {[
              { ...s.catedratico, cargo: "Catedrático" },
              ...s.auxiliares.map((a) => ({ ...a, cargo: "Auxiliar" })),
            ].map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                <span>
                  <span className="block font-medium">{p.nombre}</span>
                  <span className="text-caption text-fg-muted">{p.cargo}</span>
                </span>
                {p.id !== actor.personId && (
                  <Link
                    href={route(`/comunicacion?con=${p.id}`)}
                    className="inline-flex min-h-11 items-center text-label font-medium underline underline-offset-4"
                    aria-label={`Escribir a ${p.nombre}`}
                  >
                    Escribir
                  </Link>
                )}
              </li>
            ))}
            {s.auxiliares.length === 0 && (
              <li className="py-3 text-label text-fg-muted">Sin auxiliar asignado.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
