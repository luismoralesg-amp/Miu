"use client";

import Link from "next/link";
import type { Route } from "next";
import { ArrowUpRight } from "lucide-react";
import type { RefObject } from "react";

import { cx } from "@/lib/cx";

import { Icon } from "./icons";
import { SECTIONS, type SectionKey } from "./navigation";

/**
 * Everything not in the bar. Desktop: a panel under the header. Mobile: a bottom sheet.
 * It is navigation, so it is a labelled nav of links, not an ARIA menu.
 */
export function MorePanel({
  open,
  groups,
  panelRef,
  onNavigate,
}: {
  open: boolean;
  groups: Array<[string, SectionKey[]]>;
  panelRef: RefObject<HTMLDivElement | null>;
  onNavigate: () => void;
}) {
  return (
    <div
      id="mas-panel"
      ref={panelRef}
      data-open={open}
      className={cx(
        "fixed inset-x-0 bottom-0 z-40 max-h-[82dvh] overflow-y-auto rounded-t-[24px] border border-border bg-surface px-5 pt-3 pb-28 shadow-overlay",
        "lg:absolute lg:inset-x-auto lg:top-full lg:right-0 lg:bottom-auto lg:mt-2 lg:max-h-[calc(100dvh-6rem)] lg:w-[880px] lg:rounded-[20px] lg:px-8 lg:py-7",
        // Mobile: sheet on the drawer curve. Desktop: popover scaling from the top-right corner.
        "transition-[opacity,translate,scale,visibility] duration-280 ease-(--ease-drawer) data-[open=false]:invisible data-[open=false]:translate-y-full data-[open=false]:duration-200",
        "lg:origin-top-right lg:duration-180 lg:ease-(--ease-out) lg:data-[open=false]:translate-y-0 lg:data-[open=false]:scale-[0.97] lg:data-[open=false]:opacity-0 lg:data-[open=false]:duration-120",
        "motion-reduce:data-[open=false]:translate-y-0 motion-reduce:data-[open=false]:scale-100 motion-reduce:data-[open=false]:opacity-0",
      )}
    >
      <span
        aria-hidden="true"
        className="mx-auto mb-4 block h-1 w-10 rounded-full bg-border lg:hidden"
      />
      <nav aria-label="Más secciones" className="grid gap-x-10 gap-y-6 lg:grid-cols-3">
        {groups.map(([titulo, keys], i) => (
          <section key={titulo} aria-labelledby={`mas-grupo-${i}`}>
            <h2 id={`mas-grupo-${i}`} className="text-caption font-semibold text-fg-muted">
              {titulo}
            </h2>
            <ul className="mt-2">
              {keys.map((k) => {
                const s = SECTIONS[k];
                const inner = (
                  <>
                    <Icon name={s.icono} className="size-[18px] text-fg-muted" />
                    <span className="flex-1">{s.titulo}</span>
                    {s.externo && (
                      <>
                        <ArrowUpRight aria-hidden="true" className="size-4 text-fg-muted" />
                        <span className="sr-only"> (se abre fuera de MiU)</span>
                      </>
                    )}
                  </>
                );
                const className =
                  "-mx-2 flex min-h-11 items-center gap-3 rounded-sm px-2 text-body transition-colors duration-150 hover:bg-surface-subtle";
                return (
                  <li key={k} className={cx(k === "semana" && "lg:hidden")}>
                    {s.externo ? (
                      <a
                        href={s.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={className}
                      >
                        {inner}
                      </a>
                    ) : (
                      <Link href={s.path as Route} className={className} onClick={onNavigate}>
                        {inner}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>
    </div>
  );
}
