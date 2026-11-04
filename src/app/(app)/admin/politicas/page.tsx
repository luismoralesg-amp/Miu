import type { Metadata } from "next";

import { requirePermission } from "@/authz/server";
import { PortProblem } from "@/design-system/components";
import { PolicyForm } from "@/features/admin/policy-form";
import { PageHead } from "@/features/servicios/page-head";
import { withFault } from "@/lib/fault";
import { requireActor } from "@/modules/identity/session";
import { currentPolicy, policy } from "@/modules/policy";

import { guardarPolitica } from "./actions";

export const metadata: Metadata = { title: "Políticas" };

/** The rules the Administrativo can change, and the ones that are set by the calendar or the contract. */
export default async function PoliticasPage() {
  await requirePermission("configure_policy");
  const actor = await requireActor();
  const values = await withFault("policy", () => policy().get(actor));
  const fixed = currentPolicy(actor);

  return (
    <div className="pb-10">
      <PageHead kicker="Administración · se aplican de inmediato" title="Políticas" />
      {!values.ok ? (
        <PortProblem error={values.error} what="las políticas" className="border-y border-border" />
      ) : (
        <>
          <PolicyForm values={values.value} action={guardarPolitica} />
          <section aria-labelledby="fijas" className="mt-14 border-t border-border pt-8">
            <h2 id="fijas" className="display text-[26px] leading-tight font-medium">
              Lo que no se cambia aquí
            </h2>
            <dl className="mt-4 grid gap-x-12 gap-y-4 text-label md:grid-cols-2">
              <div>
                <dt className="text-fg-muted">Comisión ACH</dt>
                <dd className="font-medium">Sin comisión</dd>
              </div>
              <div>
                <dt className="text-fg-muted">Bancos ACH de Recurrente</dt>
                <dd className="font-medium">{fixed.bancosAch.join(", ")}</dd>
              </div>
              <div>
                <dt className="text-fg-muted">Semana de exámenes</dt>
                <dd className="font-medium">La define el calendario académico</dd>
              </div>
              <div>
                <dt className="text-fg-muted">Cierre de la nota final</dt>
                <dd className="font-medium">Solo el Maestro, salvo lo que otorgues en Roles</dd>
              </div>
            </dl>
            <p className="mt-6 text-caption text-fg-muted">
              Todos estos valores son de ejemplo hasta que la UFM los confirme.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
