import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, SearchX } from "lucide-react";

import { requirePermission } from "@/authz/server";
import {
  Badge,
  CourseDot,
  EmptyState,
  PortProblem,
  type CourseSlot,
} from "@/design-system/components";
import { RouteTabs } from "@/design-system/components/route-tabs";
import { STATUS } from "@/features/catedra/teaching";
import { plural, route, shortDate } from "@/features/shared/format";
import { cx } from "@/lib/cx";
import { withFault } from "@/lib/fault";
import { academic } from "@/modules/academic";
import { assessment, type SectionGradebook } from "@/modules/assessment";
import { requireActor } from "@/modules/identity/session";

type Props = {
  params: Promise<{ seccionId: string }>;
  searchParams: Promise<{ bajo?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seccionId } = await params;
  const sections = await academic().listTeachingSections(await requireActor());
  const s = sections.ok ? sections.value.find((x) => x.sectionId === seccionId) : undefined;
  return { title: s ? `Libro de notas · ${s.corto} ${s.seccion}` : "Libro de notas" };
}

/**
 * Every student against every activity that already closed, with the grade so far. Grades under the
 * threshold are marked in text too, not only in color; "solo bajo" narrows the list via the URL.
 */
export default async function LibroPage({ params, searchParams }: Props) {
  await requirePermission("grade");
  const actor = await requireActor();
  const { seccionId } = await params;
  const soloBajo = (await searchParams).bajo === "1";
  const sections = await withFault("academic", () => academic().listTeachingSections(actor));
  if (!sections.ok)
    return (
      <PortProblem
        error={sections.error}
        what="el libro"
        className="mt-10 border-y border-border"
      />
    );
  const s = sections.value.find((x) => x.sectionId === seccionId);
  if (!s) notFound();
  const book = await withFault("assessment", () =>
    assessment().getSectionGradebook(actor, seccionId),
  );

  return (
    <div className="pb-10">
      <section className="reveal pt-10 pb-6 md:pt-14">
        <p className="flex flex-wrap items-center gap-1.5 text-[15px] text-fg-muted">
          <CourseDot slot={s.slot as CourseSlot} />
          <Link href={route(`/catedra/secciones/${s.sectionId}`)} className="hover:underline">
            {s.nombre} · Sección {s.seccion}
          </Link>
        </p>
        <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium md:text-[64px]">
          Libro de notas
        </h1>
        {book.ok && book.value.cerrada && (
          <p className="mt-3">
            <Badge tone="success" icon={<Lock aria-hidden="true" />}>
              Nota final cerrada
            </Badge>
          </p>
        )}
      </section>
      {sections.value.length > 1 && (
        <RouteTabs
          label="Secciones"
          className="mb-8"
          tabs={sections.value.map((x) => ({
            href: route(`/catedra/libro/${x.sectionId}`),
            label: `${x.corto} ${x.seccion}`,
          }))}
        />
      )}
      {!book.ok ? (
        <PortProblem error={book.error} what="las notas" className="border-y border-border" />
      ) : (
        <Gradebook book={book.value} soloBajo={soloBajo} />
      )}
    </div>
  );
}

function Gradebook({ book, soloBajo }: { book: SectionGradebook; soloBajo: boolean }) {
  const cols = book.actividades.filter((a) => a.estado !== "programada");
  const programadas = book.actividades.length - cols.length;
  const bajo = (n: number | null) => n !== null && n < book.umbral;
  const rows = soloBajo
    ? book.estudiantes.filter((e) => e.evaluado > 0 && e.actual < book.umbral)
    : book.estudiantes;
  const base = `/catedra/libro/${book.sectionId}`;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 pb-5">
        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-label">
          <div>
            <dt className="text-fg-muted">Promedio actual</dt>
            <dd className="display text-[28px] leading-tight tabular">
              {book.promedio.toFixed(1)}
            </dd>
          </div>
          <div>
            <dt className="text-fg-muted">Bajo {book.umbral}</dt>
            <dd className="display text-[28px] leading-tight tabular">{book.bajoUmbral}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Estudiantes</dt>
            <dd className="display text-[28px] leading-tight tabular">{book.estudiantes.length}</dd>
          </div>
        </dl>
        <Link
          href={route(soloBajo ? base : `${base}?bajo=1`)}
          className={cx(
            "inline-flex h-11 items-center rounded-full border px-4 text-label font-medium transition-[transform,background-color] duration-(--duration-press) ease-(--ease-out) active:scale-[0.97]",
            soloBajo
              ? "border-fg bg-fg text-bg"
              : "border-border-control bg-surface hover:bg-surface-subtle",
          )}
        >
          {soloBajo ? "Ver toda la sección" : `Solo bajo ${book.umbral}`}
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="border-y border-border">
          <EmptyState
            icon={<SearchX aria-hidden="true" />}
            title={`Nadie está bajo ${book.umbral}`}
            description="Con lo calificado hasta hoy, toda la sección va por encima del umbral."
          />
        </div>
      ) : (
        <div
          className="relative -mx-4 overflow-x-auto px-4 focus-visible:outline-2 md:mx-0 md:px-0"
          tabIndex={0}
          role="region"
          aria-label="Libro de notas, con desplazamiento horizontal"
        >
          <table className="w-full min-w-max border-separate border-spacing-0 text-left text-[15px] tabular">
            <caption className="sr-only">
              Notas de {book.curso.nombre}, sección {book.seccion}
              {soloBajo ? `, solo estudiantes bajo ${book.umbral}` : ""}
            </caption>
            <thead className="align-bottom text-caption text-fg-muted">
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-10 border-y border-border bg-bg py-3 pr-6 font-medium"
                >
                  Estudiante
                </th>
                {cols.map((a) => (
                  <th
                    key={a.id}
                    scope="col"
                    className="max-w-36 border-y border-border px-3 py-3 text-right font-medium"
                  >
                    <span className="block text-fg">{a.titulo}</span>
                    <span className="block">
                      {a.peso} % · {shortDate(a.fecha)}
                    </span>
                    {a.estado !== "publicada" && (
                      <span className="block text-warning-fg">{STATUS[a.estado].label}</span>
                    )}
                  </th>
                ))}
                <th
                  scope="col"
                  className="border-y border-border py-3 pl-4 text-right font-medium text-fg"
                >
                  Actual
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.studentId} className="group">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-b border-border bg-bg py-2.5 pr-6 font-normal"
                  >
                    <span className="block font-medium whitespace-nowrap">{e.nombre}</span>
                    <span className="block text-caption text-fg-muted">{e.carne}</span>
                  </th>
                  {cols.map((a) => {
                    const n = e.notas[a.id] ?? null;
                    return (
                      <td
                        key={a.id}
                        className={cx(
                          "border-b border-border px-3 py-2.5 text-right",
                          bajo(n) && "font-semibold text-danger-fg",
                        )}
                      >
                        {n === null ? (
                          <span className="text-fg-muted">
                            <span aria-hidden="true">—</span>
                            <span className="sr-only">Sin nota</span>
                          </span>
                        ) : (
                          <>
                            {n}
                            {bajo(n) && <span className="sr-only"> (bajo {book.umbral})</span>}
                          </>
                        )}
                      </td>
                    );
                  })}
                  <td
                    className={cx(
                      "border-b border-border py-2.5 pl-4 text-right font-semibold",
                      e.evaluado > 0 && bajo(e.actual) && "text-danger-fg",
                    )}
                  >
                    {e.evaluado > 0 ? e.actual.toFixed(1) : "—"}
                    {e.evaluado > 0 && bajo(e.actual) && (
                      <span className="sr-only"> (bajo {book.umbral})</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="text-label text-fg-muted">
              <tr>
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-bg py-3 pr-6 text-left font-medium"
                >
                  Promedio
                </th>
                {cols.map((a) => (
                  <td key={a.id} className="px-3 py-3 text-right">
                    {a.promedio === null ? "—" : a.promedio.toFixed(1)}
                  </td>
                ))}
                <td className="py-3 pl-4 text-right font-semibold text-fg">
                  {book.promedio.toFixed(1)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      <p className="mt-6 text-caption text-fg-muted">
        La nota actual pondera solo lo calificado (también lo guardado sin publicar).
        {programadas > 0 &&
          ` Lo que aún no cierra (${plural(programadas, "actividad", "actividades")}) se agrega a la tabla al cerrar.`}{" "}
        Notas de ejemplo.
      </p>
    </>
  );
}
