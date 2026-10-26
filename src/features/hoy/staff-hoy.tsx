import Link from "next/link";
import { ArrowRight, Landmark, ListChecks, Scale, UserCog } from "lucide-react";

import { CourseDot, PortProblem } from "@/design-system/components";
import type { CourseSlot } from "@/design-system/components";
import { academicNow, longDate, quetzales, timeAgo } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { withFault } from "@/lib/fault";
import { academic } from "@/modules/academic";
import { assessment } from "@/modules/assessment";
import { ledger } from "@/modules/finance";
import type { Actor } from "@/modules/identity";

import { cap, plural, route } from "../shared/format";
import { AllDone, DayTimeline, NewsRow, SectionTitle, SideLink } from "./sections";
import { dayTimeline, duration, greeting } from "./today";

/** "hace 2 h", "ayer", "el martes", "el 14 de octubre": reads well after "llegó". */
const since = (d: Date, now: Date) => {
  const t = timeAgo(d, now);
  return /^\d/.test(t) ? `el ${t}` : t;
};

function Greeting({ actor, now, detalle }: { actor: Actor; now: Date; detalle: string }) {
  const fecha = cap(longDate(now));
  return (
    <section className="reveal pt-10 pb-8 md:pt-14 md:pb-10">
      <p className="text-[15px] text-fg-muted">
        {fecha} · {detalle}
      </p>
      <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium md:text-[64px]">
        {greeting(now)}, {actor.nombre.split(" ")[0]}
      </h1>
    </section>
  );
}

function FocusCard({
  title,
  meta,
  href,
  action,
  count,
}: {
  title: string;
  meta: string;
  href: string;
  action: string;
  count: number;
}) {
  return (
    <article
      aria-labelledby="foco-t"
      className="flex flex-col gap-6 rounded-[20px] border border-border bg-surface px-6 py-6 md:flex-row md:items-center md:justify-between md:px-9 md:py-7"
    >
      <div className="max-w-[640px]">
        <h2 id="foco-t" className="display text-[28px] leading-[1.08] font-medium md:text-[38px]">
          {title}
        </h2>
        <p className="mt-2 text-[15px] text-fg-muted">{meta}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 md:justify-end">
        <p className="display text-[52px] leading-none tabular md:text-[64px]" aria-hidden="true">
          {count}
        </p>
        <Link
          href={route(href)}
          className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-fg px-5 text-[15px] font-semibold text-bg transition-transform duration-(--duration-press) ease-(--ease-out) active:scale-[0.97]"
        >
          {action}
          <ArrowRight aria-hidden="true" className="size-[18px]" />
        </Link>
      </div>
    </article>
  );
}

/** Hoy for Maestro and Auxiliar: what is waiting to be graded first, then the day and the sections. */
export async function TeachingHoy({ actor }: { actor: Actor }) {
  const now = academicNow();
  const [sections, queue, schedule, appeals] = await Promise.all([
    withFault("academic", () => academic().listTeachingSections(actor)),
    withFault("assessment", () => assessment().listGradingQueue(actor)),
    withFault("academic", () => academic().getSchedule(actor)),
    withFault("assessment", () => assessment().listAppeals(actor)),
  ]);
  const pending = queue.ok
    ? queue.value
        .map((q) => ({ ...q, faltan: q.entregadas - q.calificadas }))
        .filter((q) => q.faltan > 0)
        // Oldest deadline first: whoever handed in earliest has waited longest for a grade.
        .sort((a, b) => a.cierre.localeCompare(b.cierre))
    : [];
  const top = pending[0];
  const totalFaltan = pending.reduce((s, q) => s + q.faltan, 0);
  const dia = dayTimeline(schedule.ok ? schedule.value : [], now);
  const nuevas = appeals.ok ? appeals.value.filter((a) => a.estado === "nueva") : [];
  const rol = actor.role === "maestro" ? "Maestro" : "Auxiliar";

  return (
    <>
      <Greeting
        actor={actor}
        now={now}
        detalle={`${rol} · ${plural(sections.ok ? sections.value.length : 0, "sección", "secciones")}`}
      />
      <div className="reveal" style={{ "--i": 1 } as React.CSSProperties}>
        {!queue.ok ? (
          <div className="rounded-[20px] border border-border">
            <PortProblem error={queue.error} what="lo que tienes por calificar" />
          </div>
        ) : top ? (
          <FocusCard
            title={`${top.titulo} · ${top.curso.corto} ${top.seccion}`}
            meta={`${top.faltan} de ${top.entregadas} sin nota. En total, ${plural(totalFaltan, "entrega espera", "entregas esperan")} en ${plural(pending.length, "actividad", "actividades")}.`}
            href={`/catedra/por-calificar?seccion=${top.sectionId}&actividad=${top.activityId}`}
            action="Calificar"
            count={top.faltan}
          />
        ) : (
          <AllDone
            title="Todo calificado"
            description="No hay entregas esperando nota en tus secciones."
          />
        )}
      </div>

      <section aria-labelledby="dia-t" className="reveal border-b border-border py-10 md:py-12">
        <SectionTitle id="dia-t">Tu día</SectionTitle>
        <p className="mt-1 text-[15px] text-fg-muted">
          {plural(dia.clases.length, "clase", "clases")}
          {dia.libre > 0 && ` · ${duration(dia.libre)} libres entre clases`}
        </p>
        {schedule.ok ? <DayTimeline dia={dia} now={now} /> : <PortProblem error={schedule.error} />}
      </section>

      <div className="grid md:grid-cols-12 md:divide-x md:divide-border">
        <section
          aria-labelledby="sec-t"
          className="reveal border-b border-border py-10 md:col-span-7 md:border-b-0 md:pr-12"
        >
          <SectionTitle id="sec-t" action={<SideLink href="/catedra">Mis secciones</SideLink>}>
            Secciones
          </SectionTitle>
          {!sections.ok ? (
            <PortProblem error={sections.error} />
          ) : (
            <ul className="mt-4 divide-y divide-border border-t border-border">
              {sections.value.map((s) => {
                const q = pending.filter((p) => p.sectionId === s.sectionId);
                return (
                  <li key={s.sectionId}>
                    <Link
                      href={route(`/catedra/secciones/${s.sectionId}`)}
                      className="-mx-2 flex min-h-16 items-center justify-between gap-4 rounded-lg px-2 py-3.5 transition-colors duration-150 hover:bg-surface-subtle"
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 font-semibold">
                          <CourseDot slot={s.slot as CourseSlot} />
                          {s.nombre} · {s.seccion}
                        </span>
                        <span className="text-label text-fg-muted">
                          {plural(s.estudiantes, "estudiante", "estudiantes")} ·{" "}
                          {s.rol === "catedratico"
                            ? `Auxiliar: ${s.auxiliares.map((a) => a.nombre).join(", ") || "sin asignar"}`
                            : `Catedrático: ${s.catedratico.nombre}`}
                        </span>
                      </span>
                      <span
                        className={cx(
                          "shrink-0 text-label tabular",
                          q.length ? "font-semibold" : "text-fg-muted",
                        )}
                      >
                        {q.length
                          ? plural(
                              q.reduce((n, x) => n + x.faltan, 0),
                              "por calificar",
                              "por calificar",
                            )
                          : "Al día"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section aria-labelledby="ap-t" className="reveal py-10 md:col-span-5 md:pl-12">
          <SectionTitle
            id="ap-t"
            action={<SideLink href="/catedra/apelaciones">Apelaciones</SideLink>}
          >
            Por responder
          </SectionTitle>
          {!appeals.ok ? (
            <PortProblem error={appeals.error} />
          ) : nuevas.length === 0 ? (
            <AllDone
              title="Sin apelaciones nuevas"
              description="Cuando un estudiante pida revisión, aparece aquí."
            />
          ) : (
            <ul className="mt-4 divide-y divide-border border-t border-border">
              {nuevas.map((a) => (
                <NewsRow
                  key={a.id}
                  now={now}
                  n={{
                    id: a.id,
                    tipo: "aviso",
                    titulo: `Apelación de ${a.estudiante.nombre}`,
                    detalle: `${a.actividad} · ${a.curso.corto} ${a.seccion}`,
                    fecha: a.fecha,
                    href: "/catedra/apelaciones",
                    slot: a.curso.slot,
                    urgente: false,
                    icono: "apelacion",
                  }}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

const SHORTCUTS = [
  { href: "/admin/pagos", label: "Pagos y conciliación", icon: Landmark },
  { href: "/admin/politicas", label: "Políticas", icon: Scale },
  { href: "/admin/roles", label: "Roles", icon: UserCog },
  { href: "/admin/auditoria", label: "Auditoría", icon: ListChecks },
] as const;

/** Hoy for the Administrativo: the transfer queue first, then the tools of the role. */
export async function AdminHoy({ actor }: { actor: Actor }) {
  const now = academicNow();
  const queue = await withFault("ledger", () => ledger().listTransferQueue(actor));
  const pendientes = queue.ok ? queue.value.filter((t) => t.estado === "pendiente") : [];
  const total = pendientes.reduce((s, t) => s + t.monto, 0);
  return (
    <>
      <Greeting actor={actor} now={now} detalle="Administrativo · Finanzas estudiantiles" />
      <div className="reveal" style={{ "--i": 1 } as React.CSSProperties}>
        {!queue.ok ? (
          <div className="rounded-[20px] border border-border">
            <PortProblem error={queue.error} what="la cola de comprobantes" />
          </div>
        ) : pendientes.length > 0 ? (
          <FocusCard
            title="Comprobantes por revisar"
            meta={`${quetzales(total)} en ${plural(pendientes.length, "transferencia", "transferencias")}. El más antiguo llegó ${since(new Date(pendientes[0]!.fecha), now)}.`}
            href="/admin/pagos"
            action="Revisar"
            count={pendientes.length}
          />
        ) : (
          <AllDone title="Cola al día" description="No hay comprobantes esperando revisión." />
        )}
      </div>
      <div className="grid md:grid-cols-12 md:divide-x md:divide-border">
        <section
          aria-labelledby="cola-t"
          className="reveal border-b border-border py-10 md:col-span-7 md:border-b-0 md:pr-12"
        >
          <SectionTitle id="cola-t" action={<SideLink href="/admin/pagos">Ver la cola</SideLink>}>
            En cola
          </SectionTitle>
          <ul className="mt-4 divide-y divide-border border-t border-border">
            {pendientes.slice(0, 5).map((t) => (
              <li key={t.id} className="flex min-h-16 items-center justify-between gap-4 py-3.5">
                <span className="min-w-0">
                  <span className="block font-semibold">{t.alumno}</span>
                  <span className="text-label text-fg-muted">
                    {t.concepto} · {t.banco} · {timeAgo(new Date(t.fecha), now)}
                  </span>
                </span>
                <span className="shrink-0 font-semibold tabular">{quetzales(t.monto)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="atajos-t" className="reveal py-10 md:col-span-5 md:pl-12">
          <SectionTitle id="atajos-t">Herramientas</SectionTitle>
          <ul className="mt-4 divide-y divide-border border-t border-border">
            {SHORTCUTS.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="-mx-2 flex min-h-14 items-center gap-3 rounded-lg px-2 transition-colors duration-150 hover:bg-surface-subtle"
                >
                  <Icon aria-hidden="true" className="size-[18px] text-fg-muted" />
                  <span className="flex-1">{label}</span>
                  <ArrowRight aria-hidden="true" className="size-4 text-fg-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
