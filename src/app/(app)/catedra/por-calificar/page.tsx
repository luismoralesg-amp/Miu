import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, PartyPopper } from "lucide-react";

import { CourseDot, EmptyState, PortProblem, type CourseSlot } from "@/design-system/components";
import { requirePermission } from "@/authz/server";
import { BatchGrader } from "@/features/catedra/batch-grader";
import { cap, plural, route } from "@/features/shared/format";
import { academicNow, hhmm, relativeDay } from "@/lib/clock";
import { withFault } from "@/lib/fault";
import { assessment } from "@/modules/assessment";
import { requireActor } from "@/modules/identity/session";

import { calificar, publicar } from "./actions";

export const metadata: Metadata = { title: "Por calificar" };

type Props = { searchParams: Promise<{ seccion?: string; actividad?: string }> };

/** The grading queue of the actor's sections, and one batch at a time. */
export default async function PorCalificarPage({ searchParams }: Props) {
  await requirePermission("grade");
  const actor = await requireActor();
  const { seccion, actividad } = await searchParams;
  const now = academicNow();

  if (seccion && actividad) {
    const batch = await withFault("assessment", () =>
      assessment().listBatch(actor, seccion, actividad),
    );
    return (
      <div className="pb-10">
        <Link
          href="/catedra/por-calificar"
          className="mt-8 inline-flex min-h-11 items-center gap-1.5 text-label font-medium text-fg-muted hover:text-fg md:mt-10"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Por calificar
        </Link>
        {!batch.ok ? (
          <PortProblem error={batch.error} what="las entregas" className="border-y border-border" />
        ) : (
          <>
            <section className="pt-2 pb-6">
              <p className="flex flex-wrap items-center gap-1.5 text-[15px] text-fg-muted">
                <CourseDot slot={batch.value.curso.slot as CourseSlot} />
                {batch.value.curso.nombre} · Sección {batch.value.seccion} · cerró{" "}
                {relativeDay(new Date(batch.value.activity.cierre), now)} a las{" "}
                {hhmm(new Date(batch.value.activity.cierre))}
              </p>
              <h1 className="mt-2 display text-[36px] leading-[1.04] font-medium md:text-[56px]">
                {batch.value.activity.titulo}
              </h1>
            </section>
            <BatchGrader batch={batch.value} save={calificar} publish={publicar} />
          </>
        )}
      </div>
    );
  }

  const queue = await withFault("assessment", () => assessment().listGradingQueue(actor));
  return (
    <div className="pb-10">
      <section className="pt-10 pb-8 md:pt-14 md:pb-10">
        <p className="text-[15px] text-fg-muted">
          {actor.role === "maestro" ? "Maestro" : "Auxiliar"} · tus secciones
        </p>
        <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium md:text-[64px]">
          Por calificar
        </h1>
      </section>
      {!queue.ok ? (
        <PortProblem error={queue.error} what="la cola" className="border-y border-border" />
      ) : queue.value.length === 0 ? (
        <div className="border-y border-border">
          <EmptyState
            icon={<PartyPopper aria-hidden="true" />}
            title="Todo calificado"
            description="No hay entregas esperando nota en tus secciones."
          />
        </div>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {queue.value.map((q) => {
            const faltan = q.entregadas - q.calificadas;
            return (
              <li key={`${q.sectionId}-${q.activityId}`}>
                <Link
                  href={route(
                    `/catedra/por-calificar?seccion=${q.sectionId}&actividad=${q.activityId}`,
                  )}
                  className="-mx-2 flex min-h-20 items-center justify-between gap-4 rounded-lg px-2 py-4 transition-colors duration-150 hover:bg-surface-subtle"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold">{q.titulo}</span>
                    <span className="flex items-center gap-1.5 text-label text-fg-muted">
                      <CourseDot slot={q.curso.slot as CourseSlot} />
                      {q.curso.nombre} · Sección {q.seccion} · cerró{" "}
                      {relativeDay(new Date(q.cierre), now)}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block display text-[28px] leading-none tabular">{faltan}</span>
                    <span className="text-caption text-fg-muted">
                      {faltan === 0 ? "al día" : cap(plural(faltan, "sin nota", "sin nota"))} de{" "}
                      {q.entregadas}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
