"use client";

import Link from "next/link";
import { LogOut, MonitorSmartphone, UserRound } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { ThemeToggle } from "@/design-system/components";
import type { Theme } from "@/design-system/theme/theme";
import { cx } from "@/lib/cx";
import { cerrarSesion } from "@/app/(auth)/login/actions";

import { popoverMotion, useDismiss } from "./use-dismiss";

export function AvatarMenu({
  nombre,
  correo,
  rol,
  theme,
  extra,
}: {
  nombre: string;
  correo: string;
  rol: string;
  theme: Theme;
  /** Development tools (role switcher), shown only when enabled. */
  extra?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    button.current?.focus();
  }, []);
  useDismiss(open, close, [button, panel]);
  const iniciales = nombre
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const item =
    "flex min-h-11 items-center gap-3 rounded-sm px-2 text-body transition-colors duration-150 hover:bg-surface-subtle";
  return (
    <div className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls="cuenta-menu"
        aria-label={`Tu cuenta: ${nombre}`}
        onClick={() => setOpen((v) => !v)}
        className="ml-1 grid size-11 place-items-center rounded-full border border-border text-label font-semibold transition-colors duration-150 hover:bg-surface-subtle"
      >
        {iniciales}
      </button>
      <div
        id="cuenta-menu"
        ref={panel}
        role="dialog"
        aria-label="Tu cuenta"
        data-open={open}
        className={cx(
          "absolute top-full right-0 z-50 mt-2 w-[300px] origin-top-right rounded-[20px] border border-border bg-surface p-3 shadow-overlay",
          popoverMotion,
        )}
      >
        <div className="px-2 pt-1 pb-3">
          <p className="font-semibold">{nombre}</p>
          <p className="truncate text-label text-fg-muted">{correo}</p>
          <p className="mt-1 text-caption text-fg-muted">{rol}</p>
        </div>
        <div className="border-t border-border pt-2">
          <Link href="/cuenta/informacion" className={item} onClick={() => setOpen(false)}>
            <UserRound aria-hidden="true" className="size-[18px] text-fg-muted" />
            Mi cuenta
          </Link>
          <Link href="/cuenta/dispositivos" className={item} onClick={() => setOpen(false)}>
            <MonitorSmartphone aria-hidden="true" className="size-[18px] text-fg-muted" />
            Accesos y dispositivos
          </Link>
        </div>
        <div className="mt-2 border-t border-border px-2 pt-3 pb-1">
          <ThemeToggle initial={theme} className="w-full justify-between" />
        </div>
        {extra && <div className="mt-2 border-t border-border px-2 pt-3 pb-1">{extra}</div>}
        <form action={cerrarSesion} className="mt-2 border-t border-border pt-2">
          <button type="submit" className={cx(item, "w-full")}>
            <LogOut aria-hidden="true" className="size-[18px] text-fg-muted" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
