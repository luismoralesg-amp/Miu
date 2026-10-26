import type { Metadata } from "next";
import { CircleCheck } from "lucide-react";

import { PortProblem } from "@/design-system/components";
import { requirePermission } from "@/authz/server";
import { ConferenceFrame, ConferenceRow } from "@/features/conferencias/parts";
import { withFault } from "@/lib/fault";
import { conferences, type Conference } from "@/modules/conferences";
import { requireActor } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Mis reservas" };

type Props = { searchParams: Promise<{ evaluada?: string }> };

const GROUPS: Array<{ titulo: string; estados: Conference["estado"][] }> = [
  { titulo: "Por evaluar", estados: ["por_evaluar"] },
  { titulo: "Próximas", estados: ["reservada", "en_espera"] },
  { titulo: "Anteriores", estados: ["evaluada", "expirada"] },
];

export default async function MisReservasPage({ searchParams }: Props) {
  await requirePermission("view_academic_record");
  const actor = await requireActor();
  const evaluada = (await searchParams).evaluada === "1";
  const mine = await withFault("conferences", () => conferences().listMine(actor));
  return (
    <ConferenceFrame eyebrow="Tus reservas, lo que falta evaluar y tu historial">
      {evaluada && (
        <p
          role="status"
          className="mb-6 flex items-center gap-2 rounded-lg bg-success-soft px-4 py-3 text-[15px] text-success-fg"
        >
          <CircleCheck aria-hidden="true" className="size-5" />
          Gracias. Tu evaluación quedó registrada.
        </p>
      )}
      {!mine.ok ? (
        <PortProblem error={mine.error} what="tus reservas" className="border-y border-border" />
      ) : (
        GROUPS.map((g) => {
          const list = mine.value.filter((c) => g.estados.includes(c.estado));
          if (list.length === 0) return null;
          return (
            <section key={g.titulo} aria-labelledby={`g-${g.titulo}`} className="pb-8">
              <h2 id={`g-${g.titulo}`} className="pb-2 display text-[28px] font-medium">
                {g.titulo} <span className="text-fg-muted tabular">{list.length}</span>
              </h2>
              <ul className="divide-y divide-border border-y border-border">
                {list.map((c) => (
                  <ConferenceRow key={c.id} c={c} />
                ))}
              </ul>
            </section>
          );
        })
      )}
    </ConferenceFrame>
  );
}
