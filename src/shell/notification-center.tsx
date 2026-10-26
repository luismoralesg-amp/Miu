"use client";

import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Bell } from "lucide-react";
import { useCallback, useRef, useState, useTransition } from "react";

import { CourseDot, type CourseSlot } from "@/design-system/components";
import { timeAgo } from "@/lib/clock";
import { cx } from "@/lib/cx";
import type { InboxItem } from "@/modules/inbox";
import { marcarLeido, marcarTodoLeido } from "@/app/(app)/bandeja/actions";

import { InboxIcon } from "@/features/shared/inbox-icon";

import { bellBadge } from "./inbox-view";
import { popoverMotion, useDismiss } from "./use-dismiss";

/**
 * The bell is a window onto the Bandeja: same read model, so the badge is always the length of the
 * list (MiU showed "1" over an empty list). Reading a notice removes it from both at once.
 */
export function NotificationCenter({ items, now }: { items: InboxItem[]; now: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    button.current?.focus();
  }, []);
  useDismiss(open, close, [button, panel]);

  const badge = bellBadge(items);
  const avisos = items.filter((i) => i.tipo === "aviso").length;
  const ahora = new Date(now);

  return (
    <div className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls="bandeja-panel"
        aria-label={badge.label}
        onClick={() => setOpen((v) => !v)}
        className="relative grid size-11 place-items-center rounded-full transition-colors duration-150 hover:bg-surface-subtle active:scale-[0.96]"
      >
        <Bell aria-hidden="true" className="size-5" />
        {badge.count > 0 && (
          <span
            aria-hidden="true"
            data-testid="campana-numero"
            className="absolute top-1.5 right-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-info-fg px-1 text-[11px] font-semibold text-surface tabular"
          >
            {badge.count}
          </span>
        )}
      </button>
      <div
        id="bandeja-panel"
        ref={panel}
        role="dialog"
        aria-label="Bandeja"
        data-open={open}
        className={cx(
          "fixed inset-x-3 top-[4.5rem] z-50 max-h-[70dvh] origin-top-right overflow-y-auto rounded-[20px] border border-border bg-surface shadow-overlay",
          "sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-[400px]",
          popoverMotion,
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <h2 className="display text-title-3 font-medium">Bandeja</h2>
          <button
            type="button"
            onClick={() => start(async () => void (await marcarTodoLeido()))}
            className="min-h-11 text-label font-medium text-fg-muted underline-offset-4 hover:text-fg hover:underline disabled:opacity-50"
            disabled={avisos === 0 || pending}
          >
            Marcar avisos como leídos
          </button>
        </div>
        {items.length === 0 ? (
          <p className="px-5 py-10 text-center text-body text-fg-muted">
            Estás al día. Te avisaremos cuando algo cambie.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.slice(0, 6).map((n) => (
              <li key={n.id}>
                <Link
                  href={n.href as Route}
                  onClick={() => {
                    if (n.tipo === "aviso") start(async () => void (await marcarLeido(n.id)));
                    setOpen(false);
                  }}
                  className="flex min-h-16 items-start gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-surface-subtle"
                >
                  <InboxIcon kind={n.icono} className="mt-0.5 size-[18px] shrink-0 text-fg-muted" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-body font-semibold">{n.titulo}</span>
                    <span className="block text-label text-fg-muted">
                      {n.slot && (
                        <CourseDot slot={n.slot as CourseSlot} className="mr-1.5 align-middle" />
                      )}
                      {n.detalle}
                      {n.tipo === "aviso" && ` · ${timeAgo(new Date(n.fecha), ahora)}`}
                    </span>
                  </span>
                  {n.urgente && (
                    <span className="mt-0.5 shrink-0 rounded-full bg-warning-soft px-2 py-0.5 text-caption font-semibold text-warning-fg">
                      Urgente
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/bandeja"
          onClick={() => setOpen(false)}
          className="flex min-h-12 items-center justify-between border-t border-border px-5 text-label font-medium transition-colors duration-150 hover:bg-surface-subtle"
        >
          Ver toda la bandeja ({items.length})
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </div>
  );
}
