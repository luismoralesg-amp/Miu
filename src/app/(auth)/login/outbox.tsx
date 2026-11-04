import { identity, maskEmail } from "@/modules/identity";
import { devToolsEnabled } from "@/modules/identity/session";

/**
 * Development only. There is no real email in the mock adapter, so the latest message is shown here
 * (and read by the E2E tests). It never renders in production unless MIU_DEV_TOOLS=1.
 */
export async function DevOutbox({ correo }: { correo: string | null }) {
  if (!devToolsEnabled() || !correo) return null;
  const mensaje = (await identity().outbox(correo)).find((m) => m.para === correo);
  if (!mensaje) return null;
  return (
    <aside
      aria-label="Correo de prueba"
      className="mt-10 rounded-md border border-dashed border-border-strong p-4 text-label"
    >
      <p className="font-semibold">Correo de prueba · solo en desarrollo</p>
      <p className="mt-1 text-fg-muted">Para {maskEmail(mensaje.para)}</p>
      <p className="mt-3">
        Código:{" "}
        <span data-testid="codigo-prueba" className="display text-title-3 tabular">
          {mensaje.codigo}
        </span>
      </p>
      <p className="mt-1 break-all">
        Enlace:{" "}
        <a
          data-testid="enlace-prueba"
          href={mensaje.enlace}
          className="underline underline-offset-4"
        >
          abrir enlace de acceso
        </a>
      </p>
    </aside>
  );
}
