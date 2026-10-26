import type { Metadata } from "next";
import Link from "next/link";

import { PortProblem } from "@/design-system/components";
import { loadCourse } from "@/features/curso/load";
import { EmptySubsection } from "@/features/curso/subsection-states";
import { dueLabel, route, shortDate } from "@/features/shared/format";
import { academicNow } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { withFault } from "@/lib/fault";
import { assessment, type ActivityStatus, type StudentActivity } from "@/modules/assessment";

export const metadata: Metadata = { title: "Actividades" };

type Props = { params: Promise<{ cursoId: string }> };

const GROUPS: Array<{ estados: ActivityStatus[]; titulo: string }> = [
  { estados: ["pendiente", "programada"], titulo: "Próximas" },
  { estados: ["entregada"], titulo: "Entregadas, en espera de nota" },
  { estados: ["calificada"], titulo: "Calificadas" },
  { estados: ["vencida"], titulo: "Vencidas sin entregar" },
];

/** The course's activities by where they stand for the student. */
export default async function CourseActivities({ params }: Props) {
  const { cursoId } = await params;
  const { actor, course } = await loadCourse(cursoId);
  if (!course.ok) return null;
  const now = academicNow();
  const acts = await withFault("assessment", () =>
    assessment().listActivities(actor, { courseId: course.value.id }),
  );
  if (!acts.ok) return <PortProblem error={acts.error} what="las actividades" />;
  if (acts.value.length === 0) return <EmptySubsection sub="actividades" />;
  return (
    <div className="flex flex-col gap-10">
      {GROUPS.map((g) => {
        const list = acts.value.filter((a) => g.estados.includes(a.estado));
        if (list.length === 0) return null;
        return (
          <section key={g.titulo} aria-labelledby={`act-${g.estados[0]}`}>
            <h2
              id={`act-${g.estados[0]}`}
              className="pb-4 display text-[24px] font-medium md:text-[28px]"
            >
              {g.titulo} <span className="text-fg-muted tabular">{list.length}</span>
            </h2>
            <ul className="divide-y divide-border border-y border-border">
              {(g.titulo === "Calificadas" ? [...list].reverse() : list).map((a) => (
                <Row key={a.id} a={a} now={now} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function Row({ a, now }: { a: StudentActivity; now: Date }) {
  const right =
    a.estado === "calificada"
      ? `${a.calificacion!.nota}`
      : a.estado === "entregada"
        ? `Entregada el ${shortDate(a.entrega!.fecha)}`
        : a.estado === "vencida"
          ? `Cerró el ${shortDate(a.fecha)}`
          : dueLabel(a.fecha, now);
  return (
    <li>
      <Link
        href={route(`/cursos/${a.curso.id}/actividades/${a.id}`)}
        className="-mx-2 flex min-h-16 items-center justify-between gap-4 rounded-lg px-2 py-3.5 transition-colors duration-150 hover:bg-surface-subtle"
      >
        <span className="min-w-0">
          <span className="block font-semibold">
            {a.titulo}
            {a.tipo === "examen" && (
              <span className="ml-2 rounded-full border border-fg px-2 py-0.5 align-middle text-caption font-semibold">
                Examen
              </span>
            )}
          </span>
          <span className="block text-label text-fg-muted">
            {a.formato} · vale {a.peso}%
          </span>
        </span>
        <span
          className={cx(
            "shrink-0 text-right tabular",
            a.estado === "calificada" ? "display text-[26px]" : "text-label text-fg-muted",
          )}
        >
          {right}
        </span>
      </Link>
    </li>
  );
}
