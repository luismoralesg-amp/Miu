import type { Metadata } from "next";
import { PartyPopper } from "lucide-react";

import { requirePermission } from "@/authz/server";
import { EmptyState, PortProblem } from "@/design-system/components";
import { AppealCard } from "@/features/catedra/appeal-card";
import { PageHead } from "@/features/servicios/page-head";
import { plural } from "@/features/shared/format";
import { academicNow } from "@/lib/clock";
import { withFault } from "@/lib/fault";
import { assessment, type Appeal } from "@/modules/assessment";
import { requireActor } from "@/modules/identity/session";

import { gestionarApelacion } from "./actions";

export const metadata: Metadata = { title: "Apelaciones" };

/** What needs a person first: new, then answered, escalated, resolved. */
const ORDER: Appeal["estado"][] = ["nueva", "respondida", "escalada", "resuelta"];

/** Students' requests to review a grade, in the sections the actor teaches or assists. */
export default async function ApelacionesPage() {
  await requirePermission("respond_appeal");
  const actor = await requireActor();
  const list = await withFault("assessment", () => assessment().listAppeals(actor));
  const ahora = academicNow().toISOString();
  const pendientes = list.ok ? list.value.filter((a) => a.estado === "nueva").length : 0;

  return (
    <div className="pb-10">
      <PageHead
        kicker={
          list.ok
            ? pendientes === 0
              ? "Ninguna por responder"
              : `${plural(pendientes, "apelación", "apelaciones")} por responder`
            : "Cátedra"
        }
        title="Apelaciones"
      />
      {!list.ok ? (
        <PortProblem error={list.error} what="las apelaciones" className="border-y border-border" />
      ) : list.value.length === 0 ? (
        <div className="border-y border-border">
          <EmptyState
            icon={<PartyPopper aria-hidden="true" />}
            title="Sin apelaciones"
            description="Cuando un estudiante pida revisar una nota publicada, aparecerá aquí."
          />
        </div>
      ) : (
        // One list, so a card keeps its state (and its confirmation) when its status changes.
        <ul aria-label="Apelaciones" className="divide-y divide-border border-y border-border">
          {[...list.value]
            .sort((x, y) => ORDER.indexOf(x.estado) - ORDER.indexOf(y.estado))
            .map((a) => (
              <AppealCard
                key={a.id}
                appeal={a}
                ahora={ahora}
                canReply={actor.role === "maestro" || actor.role === "auxiliar"}
                canResolve={actor.role === "maestro"}
                action={gestionarApelacion.bind(null, a.id)}
              />
            ))}
        </ul>
      )}
    </div>
  );
}
