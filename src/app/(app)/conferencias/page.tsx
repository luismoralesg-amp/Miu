import type { Metadata } from "next";
import { CalendarX2, Search } from "lucide-react";

import { EmptyState, PortProblem } from "@/design-system/components";
import { requirePermission } from "@/authz/server";
import { ConferenceFrame, ConferenceRow } from "@/features/conferencias/parts";
import { withFault } from "@/lib/fault";
import { conferences } from "@/modules/conferences";
import { requireActor } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Conferencias" };

type Props = { searchParams: Promise<{ q?: string }> };

/** Upcoming talks with their state for the student: reserve, wait, or cancel. */
export default async function ConferenciasPage({ searchParams }: Props) {
  await requirePermission("view_academic_record");
  const actor = await requireActor();
  const q = ((await searchParams).q ?? "").slice(0, 80);
  const list = await withFault("conferences", () => conferences().search(actor, q));
  return (
    <ConferenceFrame eyebrow="Reserva tu lugar; si está llena, entras a la lista de espera">
      <form method="get" className="relative mb-6 max-w-md">
        <label className="sr-only" htmlFor="buscar-conf">
          Buscar conferencias
        </label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-fg-muted"
        />
        <input
          id="buscar-conf"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Tema, ponente o salón"
          className="h-12 w-full rounded-full border border-border-control bg-surface pr-4 pl-11 text-body placeholder:text-fg-muted"
        />
      </form>
      {!list.ok ? (
        <PortProblem
          error={list.error}
          what="las conferencias"
          className="border-y border-border"
        />
      ) : list.value.length === 0 ? (
        <div className="border-y border-border">
          <EmptyState
            icon={<CalendarX2 aria-hidden="true" />}
            title={
              q ? `Ninguna conferencia coincide con “${q}”` : "No hay conferencias programadas"
            }
            description="Las nuevas aparecen aquí en cuanto se publican."
          />
        </div>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {list.value.map((c) => (
            <ConferenceRow key={c.id} c={c} />
          ))}
        </ul>
      )}
    </ConferenceFrame>
  );
}
