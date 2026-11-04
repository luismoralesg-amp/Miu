import type { Metadata } from "next";

import { PortProblem } from "@/design-system/components";
import { PageHead } from "@/features/servicios/page-head";
import { withFault } from "@/lib/fault";
import { directory } from "@/modules/directory";
import { requireActor } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Directorio de oficinas" };

export default async function OficinasPage() {
  await requireActor();
  const offices = await withFault("directory", () => directory().listOffices());
  return (
    <div className="pb-10">
      <PageHead kicker="Dónde está cada oficina y cómo contactarla" title="Oficinas" />
      {!offices.ok ? (
        <PortProblem error={offices.error} what="las oficinas" className="border-y border-border" />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {offices.value.map((o) => (
            <li key={o.id} className="rounded-[20px] border border-border bg-surface p-6">
              <h2 className="font-semibold">{o.nombre}</h2>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[15px]">
                <dt className="text-fg-muted">Dónde</dt>
                <dd>{o.ubicacion}</dd>
                <dt className="text-fg-muted">Horario</dt>
                <dd>{o.horario}</dd>
                <dt className="text-fg-muted">Teléfono</dt>
                <dd>
                  <a
                    href={`tel:${o.telefono.replace(/\D.*$/, "")}`}
                    className="tabular underline underline-offset-4"
                  >
                    {o.telefono}
                  </a>
                </dd>
                <dt className="text-fg-muted">Correo</dt>
                <dd>
                  <a href={`mailto:${o.correo}`} className="underline underline-offset-4">
                    {o.correo}
                  </a>
                </dd>
              </dl>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-8 text-caption text-fg-muted">
        Datos de contacto de ejemplo hasta que cada oficina los confirme.
      </p>
    </div>
  );
}
