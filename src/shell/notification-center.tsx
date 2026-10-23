"use client";

import Link from "next/link";
import type { Route } from "next";
import { Bell } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { CourseDot } from "@/design-system/components";
import { cx } from "@/lib/cx";

import type { Notification } from "./data";
import { Icon } from "./icons";
import { popoverMotion, useDismiss } from "./use-dismiss";

/**
 * Bell and panel share one list, so the badge count can never disagree with the content
 * (MiU showed "1" over an empty list).
 */
export function NotificationCenter({ items }: { items: Notification[] }) {
  const [open, setOpen] = useState(false);
  const [leidas, setLeidas] = useState<Set<string>>(() => new Set());
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    button.current?.focus();
  }, []);
  useDismiss(open, close, [button, panel]);

  const nuevas = items.filter((n) => n.nueva && !leidas.has(n.id)).length;

  return (
    <div className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls="avisos"
        aria-label={nuevas ? `Avisos, ${nuevas} sin leer` : "Avisos"}
        onClick={() => setOpen((v) => !v)}
        className="relative grid size-11 place-items-center rounded-full transition-colors duration-150 hover:bg-surface-subtle active:scale-[0.96]"
      >
        <Bell aria-hidden="true" className="size-5" />
        {nuevas > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1.5 right-1.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-info-fg px-1 text-[11px] font-semibold text-surface tabular"
          >
            {nuevas}
          </span>
        )}
      </button>
      <div
        id="avisos"
        ref={panel}
        role="dialog"
        aria-label="Avisos"
        data-open={open}
        className={cx(
          "fixed inset-x-3 top-[4.5rem] z-50 max-h-[70dvh] origin-top-right overflow-y-auto rounded-[20px] border border-border bg-surface shadow-overlay",
          "sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-[400px]",
          popoverMotion,
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <h2 className="display text-title-3 font-medium">Avisos</h2>
          <button
            type="button"
            onClick={() => setLeidas(new Set(items.map((n) => n.id)))}
            className="min-h-11 text-label font-medium text-fg-muted underline-offset-4 hover:text-fg hover:underline disabled:opacity-50"
            disabled={nuevas === 0}
          >
            Marcar todo como leído
          </button>
        </div>
        {items.length === 0 ? (
          <p className="px-5 py-10 text-center text-body text-fg-muted">
            No tienes avisos. Te avisaremos cuando algo cambie.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((n) => {
              const nueva = n.nueva && !leidas.has(n.id);
              return (
                <li key={n.id}>
                  <Link
                    href={n.href as Route}
                    onClick={() => {
                      setLeidas((s) => new Set(s).add(n.id));
                      setOpen(false);
                    }}
                    className="flex min-h-16 items-start gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-surface-subtle"
                  >
                    <Icon name={n.icono} className="mt-0.5 size-[18px] shrink-0 text-fg-muted" />
                    <span className="min-w-0 flex-1">
                      <span className={cx("block text-body", nueva && "font-semibold")}>
                        {n.titulo}
                      </span>
                      <span className="block text-label text-fg-muted">
                        {n.curso && <CourseDot slot={n.curso} className="mr-1.5 align-middle" />}
                        {n.detalle} · {n.cuando}
                      </span>
                    </span>
                    {nueva && (
                      <>
                        <span className="sr-only">Sin leer</span>
                        <span
                          aria-hidden="true"
                          className="mt-2 size-2 shrink-0 rounded-full bg-info-fg"
                        />
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
