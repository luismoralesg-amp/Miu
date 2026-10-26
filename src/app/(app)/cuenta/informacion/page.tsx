import type { Metadata } from "next";

import { PortProblem } from "@/design-system/components";
import { ContactForm } from "@/features/cuenta/contact-form";
import { CuentaFrame } from "@/features/cuenta/frame";
import { MaskedField } from "@/features/cuenta/masked-field";
import { withFault } from "@/lib/fault";
import { account } from "@/modules/account";
import { requireActor } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Información personal" };

/** Personal data: identity numbers masked by default; contact data editable with step-up. */
export default async function InformacionPage() {
  const actor = await requireActor();
  const p = await withFault("account", () => account().getProfile(actor));
  if (!p.ok)
    return (
      <CuentaFrame title="Información personal" eyebrow="Mi cuenta">
        <PortProblem error={p.error} what="tus datos" />
      </CuentaFrame>
    );
  const v = p.value;
  const row = (label: string, value: React.ReactNode) => (
    <div className="grid gap-1 border-b border-border py-4 sm:grid-cols-[14rem_1fr]">
      <dt className="text-label text-fg-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
  return (
    <CuentaFrame title="Información personal" eyebrow={`${v.nombre} ${v.apellido} · ${v.carrera}`}>
      <dl className="border-t border-border text-[15px]">
        {row("Nombre", `${v.nombre} ${v.apellido}`)}
        {row("Carné", <span className="tabular">{v.carne}</span>)}
        {row("Correo de la UFM", v.correo)}
        {row("CUI", <MaskedField campo="cui" label="CUI" masked={v.cui} />)}
        {row(
          "Fecha de nacimiento",
          <MaskedField campo="nacimiento" label="fecha de nacimiento" masked={v.nacimiento} />,
        )}
        {row("Teléfono", <span className="tabular">{v.telefono}</span>)}
        {row("Dirección", v.direccion)}
        {row(
          "Contacto de emergencia",
          `${v.contactoEmergencia.nombre} · ${v.contactoEmergencia.telefono}`,
        )}
      </dl>
      <div className="mt-6">
        <ContactForm
          initial={{
            telefono: v.telefono,
            direccion: v.direccion,
            emergenciaNombre: v.contactoEmergencia.nombre,
            emergenciaTelefono: v.contactoEmergencia.telefono,
          }}
        />
      </div>
      <p className="mt-6 text-caption text-fg-muted">
        El CUI y la fecha de nacimiento llegan ocultos desde el servidor; para verlos o cambiar
        datos pedimos un código.
      </p>
    </CuentaFrame>
  );
}
