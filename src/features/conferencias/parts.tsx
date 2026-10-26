import Link from "next/link";
import type { ReactNode } from "react";

import { RouteTabs } from "@/design-system/components";
import { cap, route } from "@/features/shared/format";
import { hhmm, longDate } from "@/lib/clock";
import { cx } from "@/lib/cx";
import type { Conference } from "@/modules/conferences";

import { cancelarReserva, reservar } from "@/app/(app)/conferencias/actions";

export function ConferenceFrame({ children, eyebrow }: { children: ReactNode; eyebrow: string }) {
  return (
    <div className="pb-10">
      <section className="reveal pt-10 pb-6 md:pt-14">
        <p className="text-[15px] text-fg-muted">{eyebrow}</p>
        <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium md:text-[64px]">
          Conferencias
        </h1>
      </section>
      <RouteTabs
        className="mb-8"
        label="Conferencias"
        tabs={[
          { href: "/conferencias", label: "Próximas" },
          { href: "/conferencias/mis-reservas", label: "Mis reservas" },
        ]}
      />
      {children}
    </div>
  );
}

const CHIP: Record<Conference["estado"], { label: string; tone: string }> = {
  disponible: { label: "Con cupo", tone: "bg-surface-subtle text-fg-muted" },
  llena: { label: "Llena · lista de espera", tone: "bg-warning-soft text-warning-fg" },
  reservada: { label: "Reservada", tone: "bg-success-soft text-success-fg" },
  en_espera: { label: "En espera", tone: "bg-warning-soft text-warning-fg" },
  por_evaluar: { label: "Por evaluar", tone: "bg-info-soft text-info-fg" },
  evaluada: { label: "Evaluada", tone: "bg-surface-subtle text-fg-muted" },
  expirada: { label: "Expirada", tone: "bg-surface-subtle text-fg-muted" },
  pasada: { label: "Pasada", tone: "bg-surface-subtle text-fg-muted" },
};

/** One talk with its state and the one action that fits it. Forms work without JavaScript. */
export function ConferenceRow({ c }: { c: Conference }) {
  const d = new Date(c.fecha);
  const chip = CHIP[c.estado];
  const button =
    "inline-flex min-h-11 items-center rounded-full px-4 text-label font-semibold transition-transform duration-(--duration-press) ease-(--ease-out) active:scale-[0.97]";
  return (
    <li
      className="flex flex-col gap-3 py-5 md:flex-row md:items-center md:justify-between"
      aria-label={c.titulo}
    >
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{c.titulo}</span>
          <span className={cx("rounded-full px-2 py-0.5 text-caption font-semibold", chip.tone)}>
            {chip.label}
            {c.estado === "en_espera" && c.posicion ? ` · puesto ${c.posicion}` : ""}
          </span>
        </p>
        <p className="text-label text-fg-muted">
          {cap(longDate(d))}, {hhmm(d)} · {c.lugar} · {c.ponente}
        </p>
        <p className="text-label text-fg-muted tabular">
          {c.estado === "por_evaluar" && c.evaluarHasta
            ? `Puedes evaluarla hasta el ${longDate(new Date(c.evaluarHasta))}.`
            : c.estado === "expirada"
              ? "No consta tu asistencia o ya cerró la evaluación."
              : `${c.inscritos} de ${c.cupo} lugares tomados`}
        </p>
      </div>
      <div className="shrink-0">
        {c.estado === "disponible" || c.estado === "llena" ? (
          <form action={reservar.bind(null, c.id)}>
            <button type="submit" className={cx(button, "bg-fg text-bg")}>
              {c.estado === "llena" ? "Unirme a la lista de espera" : "Reservar"}
            </button>
          </form>
        ) : c.estado === "reservada" || c.estado === "en_espera" ? (
          <form action={cancelarReserva.bind(null, c.id)}>
            <button
              type="submit"
              className={cx(button, "border border-border-strong")}
              aria-label={`Cancelar reserva de ${c.titulo}`}
            >
              Cancelar
            </button>
          </form>
        ) : c.estado === "por_evaluar" ? (
          <Link
            href={route(`/conferencias/${c.id}/evaluacion`)}
            className={cx(button, "bg-fg text-bg")}
          >
            Evaluar
          </Link>
        ) : null}
      </div>
    </li>
  );
}
