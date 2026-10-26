import type { Metadata } from "next";
import Link from "next/link";

import { CourseDot, PortProblem, type CourseSlot } from "@/design-system/components";
import { requirePermission } from "@/authz/server";
import { WeekFrame } from "@/features/horario/frame";
import { LOAD_LABEL, weekDays, weekItems } from "@/features/horario/week";
import { cap, route } from "@/features/shared/format";
import { academicNow, daysBetween } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { withFault } from "@/lib/fault";
import { academic } from "@/modules/academic";
import { assessment } from "@/modules/assessment";
import { requireActor } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Semana" };

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function Bars({ level, className }: { level: number; className?: string }) {
  return (
    <span aria-hidden="true" className={cx("flex gap-0.5", className)}>
      {[1, 2, 3].map((b) => (
        <i
          key={b}
          className={cx("h-3 w-1.5 rounded-sm", b <= level ? "bg-fg" : "bg-border-strong")}
        />
      ))}
    </span>
  );
}

/** Monday to Sunday with the load of each day, so a heavy day is visible before it arrives. */
export default async function SemanaPage() {
  await requirePermission("view_academic_record");
  const actor = await requireActor();
  const now = academicNow();
  const [term, schedule, acts] = await Promise.all([
    withFault("academic", () => academic().getTerm()),
    withFault("academic", () => academic().getSchedule(actor)),
    withFault("assessment", () => assessment().listActivities(actor)),
  ]);
  const days = weekDays(now);
  const first = days[0]!;
  const last = days[6]!;
  const mes = MESES[Number(last.fecha.slice(5, 7)) - 1];
  const semana = term.ok
    ? `Semana ${Math.floor(daysBetween(new Date(`${term.value.inicio}T12:00:00-06:00`), now) / 7) + 1} de ${term.value.semanas}`
    : "Esta semana";
  return (
    <WeekFrame eyebrow={semana} title={`Del ${first.numero} al ${last.numero} de ${mes}`}>
      {!schedule.ok ? (
        <PortProblem error={schedule.error} what="tu semana" className="border-y border-border" />
      ) : (
        <>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 pb-4 text-label text-fg-muted">
            <span className="sr-only">Leyenda de carga:</span>
            {LOAD_LABEL.map((l, i) => (
              <span key={l} className="flex items-center gap-1.5">
                <Bars level={i} />
                {l}
              </span>
            ))}
          </p>
          <ol className="grid border-y border-border lg:grid-cols-7 lg:divide-x lg:divide-border">
            {weekItems(days, schedule.value, acts.ok ? acts.value : []).map((d) => (
              <li
                key={d.fecha}
                aria-current={d.hoy ? "date" : undefined}
                className={cx(
                  "flex flex-col gap-4 border-b border-border py-5 lg:min-h-[280px] lg:border-b-0 lg:px-3",
                  d.hoy && "-mx-3 bg-surface px-3 lg:mx-0 lg:-my-px lg:border-y lg:border-fg/20",
                  d.pasado && "text-fg-muted",
                )}
              >
                <div className="flex items-baseline justify-between gap-2 lg:flex-col lg:items-start">
                  <p className={cx(d.hoy && "font-semibold")}>
                    <span className="text-[15px]">
                      {cap(d.nombre)}
                      {d.hoy && " · hoy"}
                    </span>{" "}
                    <span className="display text-[28px] tabular">{d.numero}</span>
                  </p>
                  <p className="flex items-center gap-2 text-label text-fg-muted">
                    <Bars level={d.carga} />
                    Carga {LOAD_LABEL[d.carga as 0 | 1 | 2 | 3].toLowerCase()}
                  </p>
                </div>
                <ul className="flex flex-col gap-1">
                  {d.items.length === 0 ? (
                    <li className="text-label text-fg-muted italic">Sin clases ni entregas</li>
                  ) : (
                    d.items.map((x) => (
                      <li key={`${x.hora}-${x.titulo}`}>
                        <Link
                          href={route(x.href)}
                          className={cx(
                            "-mx-2 flex min-h-11 flex-col rounded-lg px-2 py-1.5 transition-colors duration-150 hover:bg-surface-subtle",
                            x.tipo === "examen" && "ring-1 ring-fg",
                          )}
                        >
                          <span className="text-caption text-fg-muted tabular">
                            {x.hora} · {x.tipo === "examen" ? "Examen" : x.detalle}
                          </span>
                          <span
                            className={cx(
                              "flex items-start gap-1.5 text-label",
                              x.tipo !== "clase" && "font-semibold",
                            )}
                          >
                            <CourseDot slot={x.slot as CourseSlot} className="mt-1.5" />
                            {x.titulo}
                          </span>
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </li>
            ))}
          </ol>
        </>
      )}
    </WeekFrame>
  );
}
