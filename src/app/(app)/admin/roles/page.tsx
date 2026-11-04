import type { Metadata } from "next";

import { MATRIX, permissions, type Permission, type Rule } from "@/authz";
import { requirePermission } from "@/authz/server";
import { PortProblem } from "@/design-system/components";
import { GrantRow } from "@/features/admin/grant-row";
import { CONDITION_LABEL, PERMISSION_LABEL, SCOPE_LABEL } from "@/features/admin/permission-labels";
import { PageHead } from "@/features/servicios/page-head";
import { withFault } from "@/lib/fault";
import { roles, type Role } from "@/modules/identity";
import { requireActor } from "@/modules/identity/session";
import { policy } from "@/modules/policy";

import { otorgarCierre } from "./actions";

export const metadata: Metadata = { title: "Roles" };

const ROLE_LABEL: Record<Role, string> = {
  estudiante: "Estudiante",
  maestro: "Maestro",
  auxiliar: "Auxiliar",
  administrativo: "Administrativo",
};

function cell(rule: Rule | undefined) {
  if (!rule)
    return (
      <span aria-label="Sin acceso" className="text-fg-muted">
        —
      </span>
    );
  return (
    <>
      {SCOPE_LABEL[rule.scope]}
      {rule.when && (
        <span className="block text-caption text-fg-muted">{CONDITION_LABEL[rule.when]}</span>
      )}
    </>
  );
}

/** Who can do what and over what, as the matrix reads today; and the per-section grants the Administrativo may give. */
export default async function RolesPage() {
  await requirePermission("manage_roles");
  const actor = await requireActor();
  const grants = await withFault("policy", () => policy().listCloseGrants(actor));
  const rule = (role: Role, permission: Permission) =>
    MATRIX.find((r) => r.role === role && r.permission === permission);

  return (
    <div className="pb-10">
      <PageHead kicker="Administración · quién puede hacer qué" title="Roles" />

      <section aria-labelledby="otorgar">
        <h2 id="otorgar" className="display text-[28px] font-medium">
          Cerrar la nota final
        </h2>
        <p className="mt-1.5 max-w-prose text-label text-fg-muted">
          Por defecto solo cierra el Maestro. Aquí puedes otorgárselo a un Auxiliar, sección por
          sección; queda en la auditoría.
        </p>
        {!grants.ok ? (
          <PortProblem
            error={grants.error}
            what="los permisos"
            className="mt-4 border-y border-border"
          />
        ) : (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {grants.value.map((g) => (
              <GrantRow key={`${g.personId}-${g.sectionId}`} grant={g} action={otorgarCierre} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="matriz" className="mt-14">
        <h2 id="matriz" className="display text-[28px] font-medium">
          Matriz de permisos
        </h2>
        <p className="mt-1.5 max-w-prose text-label text-fg-muted">
          Es la matriz del documento de funciones; solo lectura. Cada celda dice sobre qué puede
          actuar el rol.
        </p>
        <div
          role="region"
          aria-label="Matriz de permisos, con desplazamiento horizontal"
          tabIndex={0}
          className="relative mt-4 overflow-x-auto border-y border-border"
        >
          <table className="w-full min-w-[44rem] border-collapse text-left text-label">
            <thead>
              <tr className="border-b border-border">
                <th
                  scope="col"
                  className="sticky left-0 z-10 w-44 bg-bg py-3 pr-4 font-semibold md:w-auto"
                >
                  Permiso
                </th>
                {roles.map((r) => (
                  <th key={r} scope="col" className="px-3 py-3 font-semibold">
                    {ROLE_LABEL[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {permissions.map((p) => (
                <tr key={p}>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 w-44 bg-bg py-2.5 pr-4 font-medium md:w-auto"
                  >
                    {PERMISSION_LABEL[p]}
                  </th>
                  {roles.map((r) => (
                    <td key={r} className="px-3 py-2.5 align-top">
                      {cell(rule(r, p))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
