import type { Metadata } from "next";
import Link from "next/link";

import { CourseDot, PortProblem, type CourseSlot } from "@/design-system/components";
import { requirePermission } from "@/authz/server";
import { WeekFrame } from "@/features/horario/frame";
import { gridBlocks, weekDays } from "@/features/horario/week";
import { cap, route } from "@/features/shared/format";
import { academicNow, hhmm } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { withFault } from "@/lib/fault";
import { academic } from "@/modules/academic";
import { requireActor } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Horario" };

const DESDE = 7;
const HASTA = 18;

/** Classes on a real hour axis; the one in progress is outlined and today carries the "now" line. */
export default async function HorarioPage() {
  await requirePermission("view_academic_record");
  const actor = await requireActor();
  const now = academicNow();
  const schedule = await withFault("academic", () => academic().getSchedule(actor));
  const allDays = weekDays(now);
  const days = schedule.ok
    ? allDays.filter((d) => d.dia <= 5 || schedule.value.some((s) => s.dia === d.dia))
    : allDays.slice(0, 5);
  const horas = Array.from({ length: HASTA - DESDE + 1 }, (_, i) => DESDE + i);
  const blocks = schedule.ok ? gridBlocks(schedule.value, now, DESDE, HASTA) : [];
  const [h = 0, m = 0] = hhmm(now).split(":").map(Number);
  const pos = ((h * 60 + m - DESDE * 60) / ((HASTA - DESDE) * 60)) * 100;
  const nowTop = pos >= 0 && pos <= 100 ? pos : null;
  return (
    <WeekFrame eyebrow="Semestre 2026-2 · clases de la semana" title="Horario">
      {!schedule.ok ? (
        <PortProblem error={schedule.error} what="tu horario" className="border-y border-border" />
      ) : (
        <>
          <div
            className="hidden md:grid"
            style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }}
          >
            <div aria-hidden="true" />
            {days.map((d) => (
              <p
                key={d.fecha}
                className={cx(
                  "border-b border-border pb-3 pl-3 text-label",
                  d.hoy ? "font-semibold" : "text-fg-muted",
                )}
              >
                {cap(d.nombre)}{" "}
                <span className="display text-[22px] text-fg tabular">{d.numero}</span>
              </p>
            ))}
            <div
              aria-hidden="true"
              className="relative"
              style={{ height: `${(HASTA - DESDE) * 56}px` }}
            >
              {horas.map((h, i) => (
                <span
                  key={h}
                  className="absolute -translate-y-1/2 text-caption text-fg-muted tabular"
                  style={{ top: `${(i / (HASTA - DESDE)) * 100}%` }}
                >
                  {String(h).padStart(2, "0")}:00
                </span>
              ))}
            </div>
            {days.map((d) => (
              <ol
                key={d.fecha}
                aria-label={`Clases del ${d.nombre}`}
                className={cx("relative border-l border-border", d.hoy && "bg-surface")}
                style={{ height: `${(HASTA - DESDE) * 56}px` }}
              >
                {horas.slice(1, -1).map((h, i) => (
                  <span
                    key={h}
                    aria-hidden="true"
                    className="absolute inset-x-0 h-px bg-border"
                    style={{ top: `${((i + 1) / (HASTA - DESDE)) * 100}%` }}
                  />
                ))}
                {d.hoy && nowTop !== null && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 z-0 h-0.5 bg-fg"
                    style={{ top: `${nowTop}%` }}
                  >
                    <span className="absolute -top-[3px] -left-1 size-2 rounded-full bg-fg" />
                  </span>
                )}
                {blocks
                  .filter((b) => b.dia === d.dia)
                  .map((b) => (
                    <li
                      key={`${b.sectionId}-${b.ini}`}
                      className="absolute inset-x-1 z-10"
                      style={{ top: `${b.top}%`, height: `${b.height}%` }}
                    >
                      <Link
                        href={route(`/cursos/${b.courseId}`)}
                        aria-label={`${b.nombre}, ${b.ini} a ${b.fin}, ${b.salon}${b.ahora ? ", en curso" : ""}`}
                        className={cx(
                          "block h-full overflow-hidden rounded-lg bg-surface px-2.5 py-1.5 transition-colors duration-150 hover:bg-surface-subtle",
                          b.ahora ? "border-2 border-fg" : "border border-border",
                        )}
                      >
                        <span className="flex items-center gap-1.5 text-label font-semibold">
                          <CourseDot slot={b.slot as CourseSlot} />
                          <span className="truncate">{b.corto}</span>
                        </span>
                        <span className="block truncate text-caption text-fg-muted">
                          {b.ahora ? "Ahora · " : `${b.ini}–${b.fin} · `}
                          {b.salon}
                        </span>
                      </Link>
                    </li>
                  ))}
              </ol>
            ))}
          </div>
          <ol className="flex flex-col gap-8 md:hidden">
            {days.map((d) => {
              const list = blocks
                .filter((b) => b.dia === d.dia)
                .sort((a, b) => a.ini.localeCompare(b.ini));
              return (
                <li key={d.fecha}>
                  <h2
                    className={cx(
                      "border-b border-border pb-2 text-[15px]",
                      d.hoy && "font-semibold",
                    )}
                  >
                    {cap(d.nombre)} {d.numero}
                    {d.hoy && " · hoy"}
                  </h2>
                  {list.length === 0 ? (
                    <p className="py-3 text-label text-fg-muted italic">Sin clases</p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {list.map((b) => (
                        <li key={`${b.sectionId}-${b.ini}`}>
                          <Link
                            href={route(`/cursos/${b.courseId}`)}
                            className="flex min-h-14 items-center gap-4 py-3"
                          >
                            <span
                              className={cx(
                                "w-24 text-[15px] tabular",
                                b.ahora ? "font-semibold" : "text-fg-muted",
                              )}
                            >
                              {b.ini}–{b.fin}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2 font-semibold">
                                <CourseDot slot={b.slot as CourseSlot} />
                                {b.nombre}
                              </span>
                              <span className="text-label text-fg-muted">
                                {b.ahora ? "Ahora · " : ""}
                                {b.salon}
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </>
      )}
    </WeekFrame>
  );
}
