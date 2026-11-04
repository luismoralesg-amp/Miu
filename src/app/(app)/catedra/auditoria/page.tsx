import type { Metadata } from "next";

import { requirePermission } from "@/authz/server";
import { PortProblem } from "@/design-system/components";
import { AuditLog } from "@/features/audit/audit-log";
import { PageHead } from "@/features/servicios/page-head";
import { plural } from "@/features/shared/format";
import { withFault } from "@/lib/fault";
import { academic } from "@/modules/academic";
import { AuditAction, audit } from "@/modules/audit";
import { requireActor } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Auditoría" };

type Props = { searchParams: Promise<{ accion?: string }> };

/** What was graded, published, closed or decided in the actor's sections. The Auxiliar sees their own actions. */
export default async function AuditoriaCatedraPage({ searchParams }: Props) {
  await requirePermission("view_audit", "grade");
  const actor = await requireActor();
  const accion = AuditAction.safeParse((await searchParams).accion);
  const sections = await withFault("academic", () => academic().listTeachingSections(actor));
  const entries = sections.ok
    ? await withFault("audit", () =>
        audit().query(actor, { sectionIds: sections.value.map((s) => s.sectionId) }),
      )
    : null;
  const own = actor.role === "auxiliar";

  return (
    <div className="pb-10">
      <PageHead
        kicker={
          entries?.ok
            ? `${plural(entries.value.length, "registro", "registros")} · ${own ? "tus acciones" : "tus secciones"}`
            : "Cátedra"
        }
        title="Auditoría"
      />
      {!sections.ok ? (
        <PortProblem
          error={sections.error}
          what="tus secciones"
          className="border-y border-border"
        />
      ) : !entries?.ok ? (
        entries && (
          <PortProblem
            error={entries.error}
            what="el registro"
            className="border-y border-border"
          />
        )
      ) : (
        <AuditLog
          entries={entries.value}
          base="/catedra/auditoria"
          filter={accion.success ? accion.data : undefined}
          actions={["calificar", "publicar", "cerrar_nota_final", "sobrescribir", "apelacion"]}
        />
      )}
    </div>
  );
}
