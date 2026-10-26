import { CalendarPlus } from "lucide-react";
import type { ReactNode } from "react";

import { RouteTabs } from "@/design-system/components";

import { PrintButton } from "./print-button";

/** Shared header of Semana and Horario: two views of the same week, each at its own URL. */
export function WeekFrame({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="pb-10">
      <section className="flex reveal flex-col gap-4 pt-10 pb-6 md:flex-row md:items-end md:justify-between md:pt-14">
        <div>
          <p className="text-[15px] text-fg-muted">{eyebrow}</p>
          <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium md:text-[56px]">
            {title}
          </h1>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <a
            href="/api/ics/horario"
            download
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-label font-medium transition-colors duration-150 hover:bg-surface-subtle"
          >
            <CalendarPlus aria-hidden="true" className="size-4" />
            Exportar a mi calendario
          </a>
          <PrintButton />
        </div>
      </section>
      <RouteTabs
        className="no-print mb-8"
        label="Vistas de la semana"
        tabs={[
          { href: "/semana", label: "Semana" },
          { href: "/horario", label: "Horario" },
        ]}
      />
      {children}
    </div>
  );
}
