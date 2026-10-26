"use client";

import Link from "next/link";
import {
  BadgeCheck,
  ChevronsUp,
  FileText,
  Megaphone,
  PencilLine,
  Presentation,
  Upload,
} from "lucide-react";
import { useState } from "react";

import { cx } from "@/lib/cx";

import { route, shortDate } from "../shared/format";
import { filterTimeline, type TimelineEvent, type TimelineFilter } from "./timeline";

const ICON = {
  nota: BadgeCheck,
  documento: FileText,
  anuncio: Megaphone,
  clase: Presentation,
  examen: PencilLine,
  entrega: Upload,
} as const;

const FILTERS: Array<[TimelineFilter, string]> = [
  ["todo", "Todo"],
  ["actividades", "Actividades"],
  ["notas", "Notas"],
  ["anuncios", "Anuncios"],
  ["documentos", "Documentos"],
];

/**
 * The course's line in time. Older items fold behind one button so the present is in view; filters
 * apply instantly (no animation: they get used over and over).
 */
export function TimelineView({ events, now }: { events: TimelineEvent[]; now: string }) {
  const [filter, setFilter] = useState<TimelineFilter>("todo");
  const [open, setOpen] = useState(false);
  const shown = filterTimeline(events, filter);
  const past = shown.filter((e) => e.pasado);
  const rest = shown.filter((e) => !e.pasado);
  const today = now.slice(0, 10);

  const label = (e: TimelineEvent) => {
    if (e.hoy) return "Hoy";
    const d = new Date(new Date(e.fecha).getTime() - 6 * 36e5).toISOString().slice(0, 10);
    const t = new Date(new Date(now).getTime() - 6 * 36e5 + 864e5).toISOString().slice(0, 10);
    if (d === today) return "Hoy";
    return d === t ? "Mañana" : shortDate(e.fecha);
  };

  const row = (e: TimelineEvent) => {
    const Icon = ICON[e.tipo];
    const futuro = !e.pasado && !e.hoy && e.fecha > now;
    const body = (
      <>
        <span className="block text-[15px] font-semibold">
          {e.titulo}
          {e.nueva && (
            <span className="ml-2 rounded-full bg-info-soft px-2 py-0.5 align-middle text-caption font-semibold text-info-fg">
              Nueva
            </span>
          )}
          {e.tipo === "examen" && (
            <span className="ml-2 rounded-full border border-fg px-2 py-0.5 align-middle text-caption font-semibold">
              Examen
            </span>
          )}
        </span>
        <span className="block text-label text-fg-muted">{e.detalle}</span>
      </>
    );
    return (
      <li
        key={e.id}
        className="relative grid grid-cols-[4.5rem_1fr] gap-x-4 md:grid-cols-[6rem_1fr]"
      >
        <span
          className={cx("pt-0.5 text-label tabular", e.hoy ? "font-semibold" : "text-fg-muted")}
        >
          {label(e)}
        </span>
        <span
          className={cx("relative border-l border-border pb-7 pl-6", futuro && "border-dashed")}
        >
          <span
            aria-hidden="true"
            className={cx(
              "absolute top-0.5 -left-[13px] grid size-6 place-items-center rounded-full",
              e.hoy
                ? "bg-fg text-bg"
                : e.tipo === "examen"
                  ? "border border-fg bg-bg"
                  : "border border-border bg-bg text-fg-muted",
            )}
          >
            <Icon className="size-3.5" />
          </span>
          {e.href ? (
            <Link
              href={route(e.href)}
              className="block rounded-md hover:underline hover:underline-offset-4"
            >
              {body}
            </Link>
          ) : (
            body
          )}
        </span>
      </li>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar la línea de tiempo">
        {FILTERS.map(([key, text]) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
            className={cx(
              "h-11 rounded-full px-4 text-label font-medium transition-transform duration-(--duration-press) ease-(--ease-out) active:scale-[0.97]",
              filter === key ? "bg-fg text-bg" : "border border-border text-fg-muted hover:text-fg",
            )}
          >
            {text}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="mt-8 text-[15px] text-fg-muted">Nada de este tipo en el curso todavía.</p>
      ) : (
        <ol className="relative mt-8" aria-label="Línea de tiempo del curso">
          {past.length > 0 &&
            (open ? (
              past.map(row)
            ) : (
              <li className="pb-7 pl-[5.5rem] md:pl-[7rem]">
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-label font-medium transition-colors duration-150 hover:bg-surface-subtle"
                >
                  <ChevronsUp aria-hidden="true" className="size-4" />
                  Ver {past.length}{" "}
                  {past.length === 1 ? "elemento anterior" : "elementos anteriores"}
                </button>
              </li>
            ))}
          {rest.map(row)}
        </ol>
      )}
    </div>
  );
}
