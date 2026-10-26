import Link from "next/link";
import { ArrowRight, PartyPopper, Sunrise, Wallet } from "lucide-react";
import type { ReactNode } from "react";

import { CourseDot, EmptyState, Skeleton } from "@/design-system/components";
import type { CourseSlot } from "@/design-system/components";
import { hhmm, longDate, quetzales, relativeDay, timeAgo } from "@/lib/clock";
import { cx } from "@/lib/cx";
import type { StudentActivity } from "@/modules/assessment";
import type { InboxItem } from "@/modules/inbox";

import { cap, dueLabel, route } from "../shared/format";
import { InboxIcon } from "../shared/inbox-icon";
import { Countdown } from "./countdown";
import { NowLine } from "./now-line";
import { duration, type HeroState, type Today } from "./today";

/* ---------- Section frame ---------- */

export function SectionTitle({
  id,
  children,
  action,
}: {
  id: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 id={id} className="display text-[28px] leading-tight font-medium md:text-[34px]">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function SideLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={route(href)}
      className="inline-flex min-h-11 shrink-0 items-center gap-1 text-label font-medium text-fg-muted transition-colors duration-150 hover:text-fg"
    >
      {children}
    </Link>
  );
}

/* ---------- Payment notice ---------- */

export function PaymentNotice({ aviso }: { aviso: NonNullable<Today["aviso"]> }) {
  const vence = new Date(`${aviso.vence}T12:00:00-06:00`);
  return (
    <Link
      href={route(`/pagos/pagar/${aviso.chargeId}`)}
      className="group -mx-2 flex min-h-11 items-center gap-2 rounded-md px-2 text-[15px] transition-colors duration-150 hover:bg-surface-subtle"
    >
      <Wallet aria-hidden="true" className="size-[18px] text-warning-fg" />
      <span>
        <span className="font-semibold tabular">{quetzales(aviso.monto)}</span>{" "}
        <span className="text-fg-muted">
          {aviso.dias <= 0
            ? "vence hoy"
            : aviso.dias === 1
              ? "vence mañana"
              : `vence en ${aviso.dias} días`}
          <span className="hidden sm:inline">, el {longDate(vence).replace(/ de \w+$/, "")}</span>
        </span>
      </span>
      <ArrowRight
        aria-hidden="true"
        className="size-4 text-fg-muted transition-transform duration-150 group-hover:translate-x-0.5"
      />
    </Link>
  );
}

/* ---------- Hero ---------- */

export function Hero({
  activity,
  estado,
  now,
  accion,
}: {
  activity: StudentActivity;
  estado: HeroState;
  now: Date;
  accion?: string;
}) {
  const urgente = estado === "urgente";
  const examen = activity.tipo === "examen";
  const href = examen
    ? `/cursos/${activity.curso.id}/documentos`
    : `/cursos/${activity.curso.id}/actividades/${activity.id}`;
  const fecha = new Date(activity.fecha);
  return (
    <article
      aria-labelledby="hero-t"
      className={cx(
        "flex flex-col gap-6 rounded-[20px] px-6 py-6 transition-colors duration-[240ms] md:flex-row md:items-center md:justify-between md:px-9 md:py-7",
        urgente
          ? "bg-linear-to-br from-accent-from to-accent-to text-on-accent"
          : "border border-border bg-surface",
      )}
    >
      <div className="max-w-[620px]">
        <h2 id="hero-t" className="display text-[28px] leading-[1.08] font-medium md:text-[38px]">
          {activity.titulo} de {activity.curso.nombre}
        </h2>
        <p className={cx("mt-2 text-[15px]", urgente ? "text-white/90" : "text-fg-muted")}>
          {cap(relativeDay(fecha, now))}, {hhmm(fecha)}
          {activity.salon ? ` · ${activity.salon}` : ""} · vale {activity.peso}%
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 md:justify-end">
        <Countdown target={activity.fecha} now={now.toISOString()} />
        <Link
          href={route(href)}
          className={cx(
            "inline-flex h-12 shrink-0 items-center gap-2 rounded-full px-5 text-[15px] font-semibold transition-transform duration-(--duration-press) ease-(--ease-out) active:scale-[0.97]",
            urgente ? "bg-white text-accent-to" : "bg-fg text-bg",
          )}
        >
          {accion ?? (examen ? "Repasar" : "Entregar")}
          <ArrowRight aria-hidden="true" className="size-[18px]" />
        </Link>
      </div>
    </article>
  );
}

export function CalmHero({ siguiente, now }: { siguiente: StudentActivity | null; now: Date }) {
  return (
    <article className="flex flex-col gap-2 rounded-[20px] border border-border bg-surface px-6 py-6 md:px-9 md:py-7">
      <h2 className="display text-[28px] font-medium md:text-[38px]">Nada urgente hoy</h2>
      <p className="text-[15px] text-fg-muted">
        {siguiente
          ? `Tu próxima fecha importante es ${siguiente.titulo} de ${siguiente.curso.corto}, ${relativeDay(new Date(siguiente.fecha), now)}.`
          : "No tienes entregas ni exámenes pendientes este período."}
      </p>
    </article>
  );
}

export function HeroSkeleton() {
  return <Skeleton className="h-[148px] rounded-[20px]" />;
}

/* ---------- Day ---------- */

export function DayTimeline({ dia, now }: { dia: Today["dia"]; now: Date }) {
  const horas = Array.from(
    { length: dia.eje.hasta - dia.eje.desde + 1 },
    (_, i) => i + dia.eje.desde,
  );
  const n = horas.length - 1;
  if (dia.clases.length === 0)
    return (
      <div className="mt-6 border-y border-border">
        <EmptyState
          icon={<Sunrise aria-hidden="true" />}
          title="Hoy no tienes clases"
          description="Aprovecha para adelantar entregas; la semana completa está en Semana."
        />
      </div>
    );
  const label = (k: Today["dia"]["clases"][number]) =>
    `${k.nombre}, ${k.ini} a ${k.fin}, ${k.salon}${k.estado === "ahora" ? ", en curso" : k.estado === "pasada" ? ", terminó" : ""}`;
  return (
    <>
      <div className="relative mt-8 hidden md:block">
        <div aria-hidden="true" className="relative h-4 text-caption text-fg-muted tabular">
          {horas.map((h, i) => (
            <span
              key={h}
              className={cx(
                "absolute",
                i === 0 ? "" : i === n ? "-translate-x-full" : "-translate-x-1/2",
              )}
              style={{ left: `${(i / n) * 100}%` }}
            >
              {String(h).padStart(2, "0")}
            </span>
          ))}
        </div>
        <div className="relative mt-3 h-[84px] border-y border-border">
          <div aria-hidden="true">
            {horas.slice(1, -1).map((h, i) => (
              <span
                key={h}
                className="absolute inset-y-0 w-px bg-border"
                style={{ left: `${((i + 1) / n) * 100}%` }}
              />
            ))}
            {dia.huecos.map((h) => (
              <p
                key={h.desde}
                className="absolute inset-y-0 flex items-center justify-center text-label text-fg-muted italic"
                style={{ left: `${h.left}%`, width: `${h.width}%` }}
              >
                {h.min >= 90 ? `${duration(h.min)} libres` : duration(h.min)}
              </p>
            ))}
          </div>
          <NowLine now={now.toISOString()} desde={dia.eje.desde} hasta={dia.eje.hasta} />
          <ol>
            {dia.clases.map((k) => (
              <li
                key={`${k.courseId}-${k.ini}`}
                className="absolute inset-y-2 z-10"
                style={{ left: `${k.left}%`, width: `${k.width}%` }}
              >
                <Link
                  href={route(`/cursos/${k.courseId}`)}
                  aria-label={label(k)}
                  className={cx(
                    "block h-full rounded-lg px-3 py-2 transition-colors duration-150",
                    k.estado === "ahora"
                      ? "border-2 border-fg bg-surface"
                      : k.estado === "pasada"
                        ? "border border-border bg-surface-subtle text-fg-muted"
                        : "border border-border bg-surface hover:bg-surface-subtle",
                  )}
                >
                  <span className="flex items-center gap-1.5 truncate text-label font-semibold">
                    <CourseDot slot={k.slot as CourseSlot} />
                    {k.corto}
                  </span>
                  <span className="block truncate text-caption text-fg-muted">
                    {k.estado === "ahora"
                      ? `Ahora · ${k.salon}`
                      : k.estado === "pasada"
                        ? "Terminó"
                        : `${k.ini} · ${k.salon.split(" ")[0]}`}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <ol className="mt-6 border-t border-border md:hidden">
        {dia.clases.map((k, i) => {
          const gap = i > 0 ? dia.huecos.find((h) => h.hasta === k.ini) : undefined;
          return (
            <li key={`${k.courseId}-${k.ini}`}>
              {gap && (
                <p className="py-2 pl-[4.5rem] text-label text-fg-muted italic">
                  {duration(gap.min)} libres
                </p>
              )}
              <Link
                href={route(`/cursos/${k.courseId}`)}
                aria-label={label(k)}
                className="flex min-h-14 items-center gap-4 border-b border-border py-3"
              >
                <span
                  className={cx(
                    "w-14 text-[15px] tabular",
                    k.estado === "ahora" ? "font-semibold" : "text-fg-muted",
                  )}
                >
                  {k.ini}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-semibold">
                    <CourseDot slot={k.slot as CourseSlot} />
                    {k.nombre}
                  </span>
                  <span className="block text-label text-fg-muted">
                    {k.estado === "ahora" ? "Ahora · " : k.estado === "pasada" ? "Terminó · " : ""}
                    {k.salon}
                  </span>
                </span>
                {k.estado === "ahora" && (
                  <span className="rounded-full border border-fg px-2 py-0.5 text-caption font-semibold">
                    Ahora
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );
}

export function DaySkeleton() {
  return (
    <div className="mt-8 flex flex-col gap-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-[84px] w-full" />
    </div>
  );
}

/* ---------- Lists ---------- */

export function PendingRow({ a, now }: { a: StudentActivity; now: Date }) {
  const soon = Date.parse(a.fecha) - now.getTime() <= 36 * 36e5;
  return (
    <li>
      <Link
        href={route(`/cursos/${a.curso.id}/actividades/${a.id}`)}
        className="-mx-2 flex min-h-16 items-center justify-between gap-4 rounded-lg px-2 py-3.5 transition-colors duration-150 hover:bg-surface-subtle"
      >
        <span className="min-w-0">
          <span className="block font-semibold">{a.titulo}</span>
          <span className="flex items-center gap-1.5 text-label text-fg-muted">
            <CourseDot slot={a.curso.slot as CourseSlot} />
            {a.curso.nombre}
          </span>
        </span>
        <span
          className={cx("shrink-0 text-label tabular", soon ? "font-semibold" : "text-fg-muted")}
        >
          {dueLabel(a.fecha, now)}
        </span>
      </Link>
    </li>
  );
}

export function NewsRow({ n, now }: { n: InboxItem; now: Date }) {
  return (
    <li>
      <Link
        href={route(n.href)}
        className="-mx-2 flex min-h-16 items-start gap-3 rounded-lg px-2 py-3.5 transition-colors duration-150 hover:bg-surface-subtle"
      >
        <InboxIcon kind={n.icono} className="mt-0.5 size-[18px] shrink-0 text-fg-muted" />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold">{n.titulo}</span>
          <span className="block text-label text-fg-muted">
            {n.slot && (
              <span className="mr-1.5 inline-block align-middle">
                <CourseDot slot={n.slot as CourseSlot} />
              </span>
            )}
            {n.detalle} ·{" "}
            <span className="whitespace-nowrap">{timeAgo(new Date(n.fecha), now)}</span>
          </span>
        </span>
        <span className="sr-only">Nueva</span>
        <span aria-hidden="true" className="mt-2 size-2 shrink-0 rounded-full bg-info-fg" />
      </Link>
    </li>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="mt-4 flex flex-col divide-y divide-border border-t border-border">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex flex-col gap-2 py-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function AllDone({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-t border-border">
      <EmptyState
        icon={<PartyPopper aria-hidden="true" />}
        title={title}
        description={description}
      />
    </div>
  );
}
