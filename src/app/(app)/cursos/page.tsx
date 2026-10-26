import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";

import { AsyncBoundary, EmptyState, PortProblem, Skeleton } from "@/design-system/components";
import { requirePermission } from "@/authz/server";
import { CoursesTable } from "@/features/cursos/courses-table";
import { toRows } from "@/features/cursos/table";
import { plural } from "@/features/shared/format";
import { academicNow } from "@/lib/clock";
import { withFault } from "@/lib/fault";
import { academic } from "@/modules/academic";
import { assessment } from "@/modules/assessment";
import { requireActor } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Cursos" };

/** The term's courses in one table: search, sort and grouping by faculty and term. */
export default async function CursosPage() {
  await requirePermission("view_course");
  return (
    <div className="pb-10">
      <AsyncBoundary fallback={<CursosSkeleton />} label="Cargando tus cursos…">
        <Cursos />
      </AsyncBoundary>
    </div>
  );
}

async function Cursos() {
  const actor = await requireActor();
  const now = academicNow();
  const [term, courses, book, acts] = await Promise.all([
    withFault("academic", () => academic().getTerm()),
    withFault("academic", () => academic().listCurrentEnrollments(actor)),
    withFault("assessment", () => assessment().getGradebook(actor)),
    withFault("assessment", () => assessment().listActivities(actor)),
  ]);
  const creditos = courses.ok ? courses.value.reduce((s, c) => s + c.creditos, 0) : 0;
  return (
    <>
      <section className="reveal pt-10 pb-8 md:pt-14 md:pb-10">
        <p className="text-[15px] text-fg-muted">
          {term.ok ? term.value.nombre : "Este período"}
          {courses.ok &&
            courses.value.length > 0 &&
            ` · ${plural(courses.value.length, "curso", "cursos")} · ${plural(creditos, "crédito", "créditos")}`}
        </p>
        <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium md:text-[64px]">
          Cursos
        </h1>
      </section>
      {!courses.ok ? (
        <PortProblem error={courses.error} what="tus cursos" className="border-y border-border" />
      ) : courses.value.length === 0 ? (
        <div className="border-y border-border">
          <EmptyState
            icon={<BookOpen aria-hidden="true" />}
            title="No tienes cursos asignados este período"
            description={
              actor.role === "estudiante" ? (
                "Cuando se abra la ventana, asígnalos en Asignar y botar cursos."
              ) : (
                <>
                  Tus secciones están en{" "}
                  <Link href="/catedra" className="underline underline-offset-4">
                    Mis secciones
                  </Link>
                  .
                </>
              )
            }
          />
        </div>
      ) : (
        <CoursesTable
          rows={toRows(
            courses.value,
            book.ok ? book.value.cursos : [],
            acts.ok ? acts.value : [],
            now,
          )}
          now={now.toISOString()}
        />
      )}
    </>
  );
}

function CursosSkeleton() {
  return (
    <div className="flex flex-col gap-4 pt-10 md:pt-14">
      <Skeleton className="h-4 w-60" />
      <Skeleton className="h-14 w-48" />
      <Skeleton className="mt-6 h-12 w-full max-w-md rounded-full" />
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
