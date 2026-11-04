import type { Metadata } from "next";
import { PartyPopper } from "lucide-react";

import { requirePermission } from "@/authz/server";
import { EmptyState, PortProblem } from "@/design-system/components";
import { AppealCard } from "@/features/catedra/appeal-card";
import { PageHead } from "@/features/servicios/page-head";
import { plural } from "@/features/shared/format";
import { academicNow } from "@/lib/clock";
import { withFault } from "@/lib/fault";
import { assessment } from "@/modules/assessment";
import { requireActor } from "@/modules/identity/session";

import { gestionarApelacion } from "../../catedra/apelaciones/actions";

export const metadata: Metadata = { title: "Apelaciones escaladas" };

/** Appeals the teaching teams passed up. The Administrativo decides: keep the grade or change it (audited). */
export default async function ApelacionesAdminPage() {
  await requirePermission("resolve_appeal", "configure_policy");
  const actor = await requireActor();
  const list = await withFault("assessment", () => assessment().listAppeals(actor));
  const ahora = academicNow().toISOString();
  const abiertas = list.ok ? list.value.filter((a) => a.estado === "escalada").length : 0;

  return (
    <div className="pb-10">
      <PageHead
        kicker={
          list.ok
            ? abiertas === 0
              ? "Ninguna por decidir"
              : `${plural(abiertas, "apelación", "apelaciones")} por decidir`
            : "Administración"
        }
        title="Apelaciones escaladas"
      />
      {!list.ok ? (
        <PortProblem error={list.error} what="las apelaciones" className="border-y border-border" />
      ) : list.value.length === 0 ? (
        <div className="border-y border-border">
          <EmptyState
            icon={<PartyPopper aria-hidden="true" />}
            title="Nada escalado"
            description="Cuando un equipo docente pase una apelación a la administración, aparecerá aquí."
          />
        </div>
      ) : (
        <ul aria-label="Apelaciones" className="divide-y divide-border border-y border-border">
          {[...list.value]
            .sort((x, y) => Number(x.estado === "resuelta") - Number(y.estado === "resuelta"))
            .map((a) => (
              <AppealCard
                key={a.id}
                appeal={a}
                ahora={ahora}
                canReply={false}
                canResolve
                action={gestionarApelacion.bind(null, a.id)}
              />
            ))}
        </ul>
      )}
    </div>
  );
}
