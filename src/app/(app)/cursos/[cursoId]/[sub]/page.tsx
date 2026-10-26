import { notFound } from "next/navigation";
import { ArrowUpRight, Download } from "lucide-react";

import { CourseDot, PortProblem, type CourseSlot } from "@/design-system/components";
import { loadCourse } from "@/features/curso/load";
import { DisabledSubsection, EmptySubsection } from "@/features/curso/subsection-states";
import { courseTimeline } from "@/features/curso/timeline";
import { TimelineView } from "@/features/curso/timeline-view";
import { cap, route, shortDate } from "@/features/shared/format";
import { academicNow, daysBetween, hhmm, longDate } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { withFault } from "@/lib/fault";
import { academic, Subsection, subsectionLabel } from "@/modules/academic";
import { assessment } from "@/modules/assessment";
import Link from "next/link";

type Props = { params: Promise<{ cursoId: string; sub: string }> };

export async function generateMetadata({ params }: Props) {
  const sub = Subsection.safeParse((await params).sub);
  return { title: sub.success ? subsectionLabel[sub.data] : "No encontrado" };
}

/** Every subsection of a course at its own URL. Unknown names are a real 404. */
export default async function CourseSubsection({ params }: Props) {
  const p = await params;
  const parsed = Subsection.safeParse(p.sub);
  if (!parsed.success || parsed.data === "actividades") notFound();
  const sub = parsed.data;
  const { actor, course } = await loadCourse(p.cursoId);
  if (!course.ok) return null;
  const c = course.value;
  const now = academicNow();
  const heading = (
    <h2 className="pb-6 display text-[28px] font-medium md:text-[34px]">{subsectionLabel[sub]}</h2>
  );
  if (c.deshabilitadas.includes(sub))
    return (
      <>
        {heading}
        <DisabledSubsection sub={sub} />
      </>
    );

  if (sub === "notas" || sub === "examenes" || sub === "actividad-reciente") {
    const [acts, book, anns, docs] = await Promise.all([
      withFault("assessment", () => assessment().listActivities(actor, { courseId: c.id })),
      withFault("assessment", () => assessment().getGradebook(actor)),
      withFault("academic", () => academic().listAnnouncements(actor, c.id)),
      withFault("academic", () => academic().listDocuments(actor, c.id)),
    ]);
    if (!acts.ok) return <PortProblem error={acts.error} />;

    if (sub === "notas") {
      const g = book.ok ? book.value.cursos.find((x) => x.curso.id === c.id) : undefined;
      if (!g)
        return (
          <>
            {heading}
            <EmptySubsection sub={sub} />
          </>
        );
      return (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-4 pb-6">
            <h2 className="display text-[28px] font-medium md:text-[34px]">Notas</h2>
            <p className="text-[15px]">
              <span className="display text-[34px] tabular">{g.actual}</span>{" "}
              <span className="text-fg-muted">
                sobre el {g.evaluado}% evaluado ·{" "}
                <Link href={route(`/notas?curso=${c.id}`)} className="underline underline-offset-4">
                  simular mi nota
                </Link>
              </span>
            </p>
          </div>
          <div
            className="overflow-x-auto focus-visible:outline-2"
            tabIndex={0}
            role="region"
            aria-label="Tabla con desplazamiento horizontal"
          >
            <table className="w-full min-w-[560px] text-left text-label tabular">
              <caption className="sr-only">Notas de {c.nombre}</caption>
              <thead className="text-caption text-fg-muted">
                <tr className="border-y border-border">
                  <th scope="col" className="py-3 pr-4 font-medium">
                    Actividad
                  </th>
                  <th scope="col" className="py-3 pr-4 text-right font-medium">
                    Peso
                  </th>
                  <th scope="col" className="py-3 pr-4 text-right font-medium">
                    Nota
                  </th>
                  <th scope="col" className="py-3 pr-4 font-medium">
                    Calificó
                  </th>
                  <th scope="col" className="py-3 font-medium">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {g.filas.map((f) => (
                  <tr key={f.activityId} className={cx(f.nota === null && "text-fg-muted")}>
                    <th scope="row" className="py-3.5 pr-4 font-medium">
                      {f.titulo}
                      {f.nueva && (
                        <span className="ml-2 rounded-full bg-info-soft px-2 py-0.5 text-caption font-semibold text-info-fg">
                          Nueva
                        </span>
                      )}
                    </th>
                    <td className="py-3.5 pr-4 text-right">{f.peso}%</td>
                    <td className="py-3.5 pr-4 text-right font-semibold">{f.nota ?? "—"}</td>
                    <td className="py-3.5 pr-4">{f.por ?? "Pendiente"}</td>
                    <td className="py-3.5">{shortDate(f.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      );
    }

    if (sub === "examenes") {
      const exams = acts.value.filter((a) => a.tipo === "examen");
      if (exams.length === 0)
        return (
          <>
            {heading}
            <EmptySubsection sub={sub} />
          </>
        );
      return (
        <>
          {heading}
          <ul className="divide-y divide-border border-y border-border">
            {exams.map((x) => {
              const d = new Date(x.fecha);
              const n = daysBetween(now, d);
              return (
                <li key={x.id}>
                  <Link
                    href={route(`/cursos/${c.id}/actividades/${x.id}`)}
                    className="-mx-2 flex min-h-16 items-center justify-between gap-4 rounded-lg px-2 py-4 transition-colors duration-150 hover:bg-surface-subtle"
                  >
                    <span>
                      <span className="flex items-center gap-2 font-semibold">
                        <CourseDot slot={c.slot as CourseSlot} />
                        {x.titulo}
                      </span>
                      <span className="block text-label text-fg-muted">
                        {cap(longDate(d))}, {hhmm(d)} · {x.salon} · vale {x.peso}%
                        {x.temas ? ` · ${x.temas}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-label text-fg-muted">
                      {x.calificacion
                        ? `Nota ${x.calificacion.nota}`
                        : n < 0
                          ? "Realizado"
                          : n === 0
                            ? "Hoy"
                            : n === 1
                              ? "Mañana"
                              : `En ${n} días`}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      );
    }

    const recent = courseTimeline(
      c,
      acts.value,
      anns.ok ? anns.value : [],
      docs.ok ? docs.value : [],
      now,
    ).filter(
      (e) =>
        daysBetween(new Date(e.fecha), now) <= 14 &&
        Date.parse(e.fecha) <= now.getTime() &&
        e.tipo !== "clase",
    );
    if (recent.length === 0)
      return (
        <>
          {heading}
          <EmptySubsection sub={sub} />
        </>
      );
    return (
      <>
        {heading}
        <TimelineView
          events={recent.map((e) => ({ ...e, pasado: false }))}
          now={now.toISOString()}
        />
      </>
    );
  }

  const content = await withFault("academic", () => academic().getSubsection(actor, c.id, sub));
  if (!content.ok) return <PortProblem error={content.error} />;
  if (content.value.estado === "deshabilitada")
    return (
      <>
        {heading}
        <DisabledSubsection sub={sub} />
      </>
    );
  const items = content.value.items;
  if (items.length === 0)
    return (
      <>
        {heading}
        <EmptySubsection sub={sub} />
      </>
    );

  if (sub === "anuncios" || sub === "programa")
    return (
      <>
        {heading}
        <div className="flex max-w-[68ch] flex-col divide-y divide-border border-y border-border">
          {items.map((i) => (
            <article key={i.id} className="py-6">
              <h3 className="text-title-3 font-semibold">{i.titulo}</h3>
              {i.fecha && (
                <p className="text-label text-fg-muted">{cap(longDate(new Date(i.fecha)))}</p>
              )}
              <p className="mt-2 text-body">{i.detalle}</p>
            </article>
          ))}
        </div>
      </>
    );

  return (
    <>
      {heading}
      <ul className="divide-y divide-border border-y border-border">
        {items.map((i) => {
          const inner = (
            <>
              <span className="min-w-0">
                <span className="block font-semibold">{i.titulo}</span>
                <span className="block text-label text-fg-muted">
                  {i.detalle}
                  {i.fecha && ` · ${shortDate(i.fecha)}`}
                </span>
              </span>
              {i.externo ? (
                <span className="flex shrink-0 items-center gap-1 text-label text-fg-muted">
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                  <span className="sr-only">(se abre fuera de MiU)</span>
                </span>
              ) : sub === "documentos" ? (
                <Download aria-hidden="true" className="size-[18px] shrink-0 text-fg-muted" />
              ) : null}
            </>
          );
          const cls =
            "-mx-2 flex min-h-16 items-center justify-between gap-4 rounded-lg px-2 py-3.5 transition-colors duration-150 hover:bg-surface-subtle";
          return (
            <li key={i.id}>
              {sub === "documentos" ? (
                <a
                  href={`/api/documentos/${i.id}`}
                  download
                  className={cls}
                  aria-label={`Descargar ${i.titulo}`}
                >
                  {inner}
                </a>
              ) : i.externo && i.href ? (
                <a href={i.href} target="_blank" rel="noopener noreferrer" className={cls}>
                  {inner}
                </a>
              ) : i.href ? (
                <Link href={route(i.href)} className={cls}>
                  {inner}
                </Link>
              ) : (
                <div className={cls.replace("hover:bg-surface-subtle", "")}>{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
