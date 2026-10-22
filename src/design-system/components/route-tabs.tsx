"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";

import { cx } from "@/lib/cx";

export type RouteTab = { href: Route; label: string; count?: number };

/**
 * Sub-navigation where every tab is a real URL (MiU used in-page hash tabs with no deep links).
 * These are links, not an ARIA tablist: they navigate, so `aria-current="page"` marks the active one.
 * No animation on switch: people move between tabs dozens of times a day.
 */
export function RouteTabs({
  tabs,
  label,
  exact = true,
  className,
}: {
  tabs: RouteTab[];
  label: string;
  /** Match the pathname exactly; set false so nested routes keep their parent tab active. */
  exact?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label={label}
      className={cx("-mx-4 [scrollbar-width:none] overflow-x-auto px-4", className)}
    >
      <ul className="flex w-max gap-1 border-b border-border">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "relative inline-flex h-11 items-center gap-2 px-3 text-label font-medium whitespace-nowrap",
                  "after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full",
                  active
                    ? "text-fg after:bg-accent-to"
                    : "text-fg-muted after:bg-transparent hover:text-fg",
                )}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="rounded-sm bg-surface-subtle px-1.5 text-caption text-fg-muted tabular">
                    {tab.count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
