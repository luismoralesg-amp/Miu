import type { Metadata } from "next";

import { PortProblem } from "@/design-system/components";
import { requirePermission } from "@/authz/server";
import { PensumGraph } from "@/features/pensum/pensum-graph";
import { withFault } from "@/lib/fault";
import { curriculum } from "@/modules/curriculum";
import { requireActor } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Pensum" };

/** Progress through the career and the prerequisite graph. */
export default async function PensumPage() {
  await requirePermission("view_academic_record");
  const actor = await requireActor();
  const p = await withFault("curriculum", () => curriculum().getPensum(actor));
  return (
    <div className="pb-10">
      <section className="flex reveal flex-col gap-4 pt-10 pb-8 md:flex-row md:items-end md:justify-between md:pt-14 md:pb-10">
        <div>
          <p className="text-[15px] text-fg-muted">
            {p.ok ? p.value.carrera : "Tu carrera"} · pensum de ejemplo
          </p>
          <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium md:text-[64px]">
            Pensum
          </h1>
        </div>
        {p.ok && (
          <dl className="flex gap-8 text-[15px]">
            <div>
              <dt className="text-label text-fg-muted">Cursos aprobados</dt>
              <dd className="display text-[32px] tabular">
                {p.value.avance.aprobados}{" "}
                <span className="text-[18px] text-fg-muted">de {p.value.avance.total}</span>
              </dd>
            </div>
            <div>
              <dt className="text-label text-fg-muted">UMA</dt>
              <dd className="display text-[32px] tabular">
                {p.value.avance.umaAprobadas}{" "}
                <span className="text-[18px] text-fg-muted">de {p.value.avance.umaTotales}</span>
              </dd>
            </div>
            <div>
              <dt className="text-label text-fg-muted">En curso</dt>
              <dd className="display text-[32px] tabular">{p.value.avance.enCurso}</dd>
            </div>
          </dl>
        )}
      </section>
      {!p.ok ? (
        <PortProblem error={p.error} what="tu pensum" className="border-y border-border" />
      ) : (
        <PensumGraph pensum={p.value} />
      )}
    </div>
  );
}
