"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutGrid, Search } from "lucide-react";
import { useRef, useState, useTransition } from "react";

import { BrandMark, Kbd } from "@/design-system/components";
import type { Theme } from "@/design-system/theme/theme";
import { cx } from "@/lib/cx";
import { roleLabel, roles, type Role } from "@/modules/identity/domain/types";

import { cambiarRol } from "./actions";
import { AvatarMenu } from "./avatar-menu";
import { CommandPalette } from "./command-palette";
import type { InboxItem } from "@/modules/inbox";

import type { CommandItem } from "./commands";
import { Icon } from "./icons";
import { MorePanel } from "./more-panel";
import { BAR_LABEL, NAV, SECTIONS, type SectionKey } from "./navigation";
import { NotificationCenter } from "./notification-center";
import { useDismiss } from "./use-dismiss";

type Props = {
  nombre: string;
  correo: string;
  rol: Role;
  theme: Theme;
  commands: CommandItem[];
  /** The Bandeja's items; the bell shows them and their count. */
  inbox: InboxItem[];
  now: string;
  devTools: boolean;
  children: React.ReactNode;
};

/** The section the URL belongs to: the longest matching path, so /catedra/libro doesn't light up /catedra. */
function activeKey(keys: SectionKey[], pathname: string): SectionKey | undefined {
  return keys
    .filter((k) => {
      const p = SECTIONS[k].path;
      return p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(`${p}/`);
    })
    .sort((a, b) => SECTIONS[b].path.length - SECTIONS[a].path.length)[0];
}

export function AppShell({
  nombre,
  correo,
  rol,
  theme,
  commands,
  inbox,
  now,
  devTools,
  children,
}: Props) {
  const pathname = usePathname();
  const nav = NAV[rol];
  const todas = [...new Set([...nav.barra, ...nav.mas.flatMap(([, k]) => k)])];
  const activa = activeKey(todas, pathname);
  const enMas = activa !== undefined && !nav.movil.includes(activa);

  const [masOpen, setMasOpen] = useState(false);
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const masButton = useRef<HTMLButtonElement>(null);
  const masMobileButton = useRef<HTMLButtonElement>(null);
  const masPanel = useRef<HTMLDivElement>(null);
  const closeMas = () => setMasOpen(false);
  useDismiss(masOpen, closeMas, [masButton, masMobileButton, masPanel]);
  // Close the panel when the route changes (state reset during render, not in an effect).
  const [ultimaRuta, setUltimaRuta] = useState(pathname);
  if (ultimaRuta !== pathname) {
    setUltimaRuta(pathname);
    setMasOpen(false);
  }

  const linkClass = (k: SectionKey) =>
    cx(
      "relative inline-flex h-full items-center whitespace-nowrap",
      k === activa
        ? "font-semibold text-fg after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-fg"
        : "text-fg-muted transition-colors duration-150 hover:text-fg",
    );

  return (
    <div className="min-h-dvh pb-24 lg:pb-0">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2"
      >
        Saltar al contenido
      </a>
      <header className="mx-auto max-w-[1240px] px-5 md:px-12">
        <div className="relative flex h-16 items-center justify-between gap-6 border-b border-border md:h-20">
          <Link href="/" aria-label="MiU, inicio" className="shrink-0">
            <BrandMark />
          </Link>

          <nav
            aria-label="Principal"
            className="hidden h-full items-center gap-8 text-[15px] lg:flex"
          >
            {nav.barra.map((k) => (
              <Link
                key={k}
                href={SECTIONS[k].path as Route}
                aria-current={k === activa ? "page" : undefined}
                className={linkClass(k)}
              >
                {BAR_LABEL[k] ?? SECTIONS[k].titulo}
              </Link>
            ))}
            <button
              ref={masButton}
              type="button"
              aria-expanded={masOpen}
              aria-controls="mas-panel"
              onClick={() => setMasOpen((v) => !v)}
              className={cx(
                "flex h-full items-center gap-1",
                masOpen || (activa && !nav.barra.includes(activa))
                  ? "font-semibold text-fg"
                  : "text-fg-muted hover:text-fg",
              )}
            >
              Más
              <ChevronDown
                aria-hidden="true"
                className={cx("size-4 transition-transform duration-200", masOpen && "rotate-180")}
              />
            </button>
          </nav>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCmdkOpen(true)}
              aria-label="Buscar o hacer algo"
              aria-keyshortcuts="Meta+K Control+K"
              className="flex h-11 items-center gap-2 rounded-full px-3 text-label text-fg-muted transition-colors duration-150 hover:bg-surface-subtle"
            >
              <Search aria-hidden="true" className="size-[18px]" />
              <span className="hidden md:inline">Buscar o hacer algo</span>
              <span className="hidden md:inline">
                <Kbd>⌘K</Kbd>
              </span>
            </button>
            <NotificationCenter items={inbox} now={now} />
            <AvatarMenu
              nombre={nombre}
              correo={correo}
              rol={roleLabel[rol]}
              theme={theme}
              extra={devTools ? <RoleSwitcher rol={rol} /> : null}
            />
          </div>

          <MorePanel open={masOpen} groups={nav.mas} panelRef={masPanel} onNavigate={closeMas} />
        </div>
      </header>

      {masOpen && <div aria-hidden="true" className="fixed inset-0 z-30 bg-scrim lg:hidden" />}

      <main id="contenido" className="mx-auto max-w-[1240px] px-5 pb-16 md:px-12">
        {children}
      </main>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="grid grid-cols-5 text-[11px] font-medium">
          {nav.movil.map((k) => (
            <li key={k}>
              <Link
                href={SECTIONS[k].path as Route}
                aria-current={k === activa ? "page" : undefined}
                className={cx(
                  "flex min-h-14 flex-col items-center justify-center gap-1",
                  k === activa ? "text-fg" : "text-fg-muted",
                )}
              >
                <Icon name={SECTIONS[k].icono} className="size-6" />
                {BAR_LABEL[k] ?? SECTIONS[k].titulo}
              </Link>
            </li>
          ))}
          <li>
            <button
              ref={masMobileButton}
              type="button"
              aria-expanded={masOpen}
              aria-controls="mas-panel"
              onClick={() => setMasOpen((v) => !v)}
              className={cx(
                "flex min-h-14 w-full flex-col items-center justify-center gap-1",
                masOpen || enMas ? "text-fg" : "text-fg-muted",
              )}
            >
              <LayoutGrid aria-hidden="true" className="size-6" />
              Más
            </button>
          </li>
        </ul>
      </nav>

      <CommandPalette items={commands} open={cmdkOpen} onOpenChange={setCmdkOpen} />
    </div>
  );
}

/** Development only (MIU_DEV_TOOLS): view the app as each role. */
function RoleSwitcher({ rol }: { rol: Role }) {
  const [pending, start] = useTransition();
  return (
    <label className="flex items-center justify-between gap-2 rounded-md border border-dashed border-border-strong px-3 py-1.5 text-caption">
      <span className="text-fg-muted">Rol (desarrollo)</span>
      <select
        value={rol}
        disabled={pending}
        onChange={(event) => start(() => cambiarRol(event.target.value as Role))}
        className="min-h-8 rounded-sm bg-transparent font-semibold"
      >
        {roles.map((r) => (
          <option key={r} value={r}>
            {roleLabel[r]}
          </option>
        ))}
      </select>
    </label>
  );
}
