import type { Metadata } from "next";

import { PortProblem } from "@/design-system/components";
import { CuentaFrame } from "@/features/cuenta/frame";
import { PrivacyForm } from "@/features/cuenta/privacy-form";
import { withFault } from "@/lib/fault";
import { account } from "@/modules/account";
import { requireActor } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Privacidad" };

export default async function PrivacidadPage() {
  const actor = await requireActor();
  const p = await withFault("account", () => account().getPrivacy(actor));
  return (
    <CuentaFrame title="Privacidad" eyebrow="Qué ven los demás de ti; todo apagado por defecto">
      {p.ok ? (
        <PrivacyForm initial={p.value} />
      ) : (
        <PortProblem error={p.error} what="tu privacidad" />
      )}
    </CuentaFrame>
  );
}
