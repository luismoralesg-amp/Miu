import Link from "next/link";
import { FileText } from "lucide-react";

import { PortProblem } from "@/design-system/components";
import { courseHighlights, courseTimeline } from "@/features/curso/timeline";
import { TimelineView } from "@/features/curso/timeline-view";
import { loadCourse } from "@/features/curso/load";
import { cap, dueLabel, route } from "@/features/shared/format";
import { academicNow, timeAgo } from "@/lib/clock";
import { withFault } from "@/lib/fault";
import { academic } from "@/modules/academic";
import { assessment } from "@/modules/assessment";

type Props = { params: Promise<{ cursoId: string }> };

/** Course overview: the line in time on the left; what matters first on the right. */
export default async function CourseOverview({ params }: Props) {
  const { cursoId } = await params;
  const { actor, course } = await loadCourse(cursoId);
  if (!course.ok) return null;
  const c = course.value;
  const now = academicNow();
  const [acts, anns, docs, book] = await Promise.all([
    withFault("assessment", () => assessment().listActivities(actor, { courseId: c.id })),
    withFault("academic", () => academic().listAnnouncements(actor, c.id)),
    withFault("academic", () => academic().listDocuments(actor, c.id)),
    withFault("assessment", () => assessment().getGradebook(actor)),
  ]);
  const grades = book.ok ? book.value.cursos.find((x) => x.curso.id === c.id) : undefined;
  const h = courseHighlights(acts.ok ? acts.value : [], anns.ok ? anns.value : [], now);
  const programa = docs.ok ? docs.value.find((d) => d.titulo.startsWith("Programa")) : undefined;

  return (
    <div className="grid gap-10 md:grid-cols-12">
      <div className="md:col-span-8">
        {!acts.ok ? (
          <PortProblem error={acts.error} what="la línea de tiempo" />
        ) : (
          <TimelineView
            events={courseTimeline(
              c,
              acts.value,
              anns.ok ? anns.value : [],
              docs.ok ? docs.value : [],
              now,
            )}
            now={now.toISOString()}
          />
        )}
      </div>
      <aside
        aria-label="Datos del curso"
        className="order-first border-b border-border pb-8 md:order-none md:col-span-4 md:border-b-0 md:border-l md:pb-0 md:pl-10"
      >
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 text-[15px] md:flex md:flex-col md:gap-6">
          <div>
            <dt className="text-label text-fg-muted">Nota actual</dt>
            <dd className="mt-1">
              {grades && grades.evaluado > 0 ? (
                <>
                  <Link
                    href={route(`/cursos/${c.id}/notas`)}
                    className="display text-[40px] leading-none tabular hover:underline hover:underline-offset-4"
                  >
                    {grades.actual}
                  </Link>{" "}
                  <span className="text-label text-fg-muted">
                    sobre el {grades.evaluado}% evaluado
                  </span>
                </>
              ) : (
                <span className="text-fg-muted">Aún sin notas publicadas</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-label text-fg-muted">Próxima actividad</dt>
            <dd className="mt-1">
              {h.proxima ? (
                <Link
                  href={route(`/cursos/${c.id}/actividades/${h.proxima.id}`)}
                  className="font-semibold underline-offset-4 hover:underline"
                >
                  {h.proxima.titulo}
                  <span className="block font-normal text-fg-muted">
                    {dueLabel(h.proxima.fecha, now)}
                  </span>
                </Link>
              ) : (
                <span className="text-fg-muted">Nada pendiente</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-label text-fg-muted">Último anuncio</dt>
            <dd className="mt-1">
              {h.ultimoAnuncio ? (
                <Link
                  href={route(`/cursos/${c.id}/anuncios`)}
                  className="underline-offset-4 hover:underline"
                >
                  {h.ultimoAnuncio.titulo}
                  <span className="block text-label text-fg-muted">
                    {h.ultimoAnuncio.autor.nombre} ·{" "}
                    {cap(timeAgo(new Date(h.ultimoAnuncio.fecha), now))}
                  </span>
                </Link>
              ) : (
                <span className="text-fg-muted">Sin anuncios</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-label text-fg-muted">Catedrático</dt>
            <dd className="mt-1">
              {c.catedratico.nombre}
              <br />
              <Link
                href={route(`/comunicacion?con=${c.catedratico.id}`)}
                className="text-label text-fg-muted underline underline-offset-4 hover:text-fg"
              >
                Escribirle
              </Link>
            </dd>
          </div>
          {c.auxiliares.map((a) => (
            <div key={a.id}>
              <dt className="text-label text-fg-muted">Auxiliar</dt>
              <dd className="mt-1">
                {a.nombre}
                <br />
                <Link
                  href={route(`/comunicacion?con=${a.id}`)}
                  className="text-label text-fg-muted underline underline-offset-4 hover:text-fg"
                >
                  Escribirle
                </Link>
              </dd>
            </div>
          ))}
          <div>
            <dt className="text-label text-fg-muted">Programa del curso</dt>
            <dd className="mt-1">
              <Link
                href={route(`/cursos/${c.id}/programa`)}
                className="inline-flex items-center gap-1.5 underline underline-offset-4"
              >
                <FileText aria-hidden="true" className="size-4" />
                {programa ? programa.titulo : "Ver el programa"}
              </Link>
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
