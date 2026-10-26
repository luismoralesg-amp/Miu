import type { Metadata } from "next";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { AsyncBoundary, PortProblem, Skeleton } from "@/design-system/components";
import { requirePermission } from "@/authz/server";
import { CourseCards } from "@/features/notas/course-cards";
import { gradeProfile } from "@/features/notas/model";
import { TrendChart } from "@/features/notas/trend-chart";
import { academicNow, daysBetween } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { withFault } from "@/lib/fault";
import { academic } from "@/modules/academic";
import { assessment } from "@/modules/assessment";
import { requireActor } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Notas" };

type Props = { searchParams: Promise<{ curso?: string }> };

/** Every grade of the term and the academic profile: average, trend and what each target needs. */
export default async function NotasPage({ searchParams }: Props) {
  await requirePermission("view_academic_record");
  const curso = (await searchParams).curso ?? null;
  return (
    <div className="pb-10">
      <AsyncBoundary fallback={<NotasSkeleton />} label="Cargando tus notas…">
        <Notas curso={curso} />
      </AsyncBoundary>
    </div>
  );
}

async function Notas({ curso }: { curso: string | null }) {
  const actor = await requireActor();
  const [book, term] = await Promise.all([
    withFault("assessment", () => assessment().getGradebook(actor)),
    withFault("academic", () => academic().getTerm()),
  ]);
  const semana = term.ok
    ? Math.floor(daysBetween(new Date(`${term.value.inicio}T12:00:00-06:00`), academicNow()) / 7) +
      1
    : null;
  return (
    <>
      <section className="reveal pt-10 pb-8 md:pt-14 md:pb-10">
        <p className="text-[15px] text-fg-muted">
          {term.ok
            ? `${term.value.nombre} · semana ${semana} de ${term.value.semanas}`
            : "Este semestre"}
        </p>
        <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium md:text-[64px]">
          Notas
        </h1>
      </section>
      {!book.ok ? (
        <PortProblem error={book.error} what="tus notas" className="border-y border-border" />
      ) : (
        <Body book={book.value} curso={curso} />
      )}
    </>
  );
}

function Body({ book, curso }: { book: Parameters<typeof gradeProfile>[0]; curso: string | null }) {
  const p = gradeProfile(book);
  const sube = (p.delta ?? 0) >= 0;
  const abierto = book.cursos.some((c) => c.curso.id === curso)
    ? curso
    : (book.cursos[0]?.curso.id ?? null);
  return (
    <>
      <section
        aria-labelledby="prom-t"
        className="grid reveal items-end gap-8 border-y border-border py-10 md:grid-cols-12"
      >
        <div className="md:col-span-5">
          <h2 id="prom-t" className="text-[15px] text-fg-muted">
            Promedio del semestre, sobre lo evaluado
          </h2>
          <p className="mt-2 flex items-baseline gap-3">
            <span className="display text-[88px] leading-none tabular md:text-[112px]">
              {p.promedio}
            </span>
            {p.delta !== null && (
              <span
                className={cx(
                  "flex items-center gap-1 text-[15px] font-semibold tabular",
                  sube ? "text-success-fg" : "text-danger-fg",
                )}
              >
                {sube ? (
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                ) : (
                  <ArrowDownRight aria-hidden="true" className="size-4" />
                )}
                <span className="sr-only">{sube ? "sube" : "baja"}</span>
                {Math.abs(p.delta)}
              </span>
            )}
          </p>
          {p.anterior !== null && (
            <p className="mt-3 text-[15px] text-fg-muted">
              El semestre anterior cerraste con {p.anterior}.
            </p>
          )}
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <TrendChart serie={p.serie} />
        </div>
      </section>
      <section aria-labelledby="cur-t" className="reveal py-10">
        <h2 id="cur-t" className="pb-4 display text-[28px] font-medium md:text-[34px]">
          Por curso
        </h2>
        <CourseCards
          cursos={book.cursos}
          metas={book.metas}
          umbral={book.umbral}
          abierto={abierto}
        />
        <p className="mt-4 text-caption text-fg-muted">
          Metas {book.metas.join(", ")} y aprobación con {book.umbral}: valores de ejemplo hasta que
          los confirme la UFM.
        </p>
      </section>
    </>
  );
}

function NotasSkeleton() {
  return (
    <div className="flex flex-col gap-4 pt-10 md:pt-14">
      <Skeleton className="h-4 w-60" />
      <Skeleton className="h-14 w-40" />
      <div className="mt-8 grid gap-10 md:grid-cols-12">
        <Skeleton className="h-64 md:col-span-4" />
        <div className="flex flex-col gap-4 md:col-span-8">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    </div>
  );
}
