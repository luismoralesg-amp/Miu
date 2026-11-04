import type { Metadata } from "next";

import { requirePermission } from "@/authz/server";
import { PortProblem } from "@/design-system/components";
import { AuditLog } from "@/features/audit/audit-log";
import { PageHead } from "@/features/servicios/page-head";
import { plural } from "@/features/shared/format";
import { withFault } from "@/lib/fault";
import { AuditAction, audit } from "@/modules/audit";
import { requireActor } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Auditoría" };

type Props = { searchParams: Promise<{ accion?: string }> };

/** Every sensitive change: grades, closes, payments, refunds, policies and roles. Append-only. */
export default async function AuditoriaAdminPage({ searchParams }: Props) {
  await requirePermission("view_audit", "configure_policy");
  const actor = await requireActor();
  const accion = AuditAction.safeParse((await searchParams).accion);
  const entries = await withFault("audit", () => audit().query(actor, {}));

  return (
    <div className="pb-10">
      <PageHead
        kicker={
          entries.ok
            ? `${plural(entries.value.length, "registro", "registros")} · toda la universidad`
            : "Administración"
        }
        title="Auditoría"
      />
      {!entries.ok ? (
        <PortProblem error={entries.error} what="el registro" className="border-y border-border" />
      ) : (
        <AuditLog
          entries={entries.value}
          base="/admin/auditoria"
          filter={accion.success ? accion.data : undefined}
          actions={[
            "calificar",
            "publicar",
            "cerrar_nota_final",
            "sobrescribir",
            "apelacion",
            "aprobar_pago",
            "rechazar_pago",
            "reembolso",
            "politica",
            "rol",
          ]}
        />
      )}
    </div>
  );
}
