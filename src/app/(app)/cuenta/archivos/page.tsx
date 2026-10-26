import type { Metadata } from "next";
import { HardDrive } from "lucide-react";

import { PortProblem } from "@/design-system/components";
import { CuentaFrame } from "@/features/cuenta/frame";
import { shortDate } from "@/features/shared/format";
import { withFault } from "@/lib/fault";
import { account } from "@/modules/account";
import { requireActor } from "@/modules/identity/session";

import { permisoDrive } from "../actions";

export const metadata: Metadata = { title: "Mis archivos" };

/** Google Drive only with explicit, revocable, read-only consent. */
export default async function ArchivosPage() {
  const actor = await requireActor();
  const drive = await withFault("account", () => account().getDrive(actor));
  return (
    <CuentaFrame title="Mis archivos" eyebrow="Tus archivos de Drive, solo si das permiso">
      {!drive.ok ? (
        <PortProblem error={drive.error} what="tus archivos" />
      ) : !drive.value.conectado ? (
        <section className="flex max-w-xl flex-col items-start gap-4 rounded-[20px] border border-border bg-surface p-6">
          <HardDrive aria-hidden="true" className="size-6" />
          <h2 className="text-title-3 font-semibold">MiU no ve tu Drive</h2>
          <p className="text-[15px] text-fg-muted">
            Si das permiso, MiU podrá leer (no modificar) la lista de tus archivos para adjuntarlos
            a entregas. Puedes quitarlo cuando quieras.
          </p>
          <form action={permisoDrive}>
            <input type="hidden" name="permitir" value="1" />
            <button
              type="submit"
              className="inline-flex h-11 items-center rounded-full bg-fg px-5 text-label font-semibold text-bg"
            >
              Permitir acceso de solo lectura
            </button>
          </form>
        </section>
      ) : (
        <>
          <ul
            className="divide-y divide-border border-y border-border"
            aria-label="Archivos de Drive"
          >
            {drive.value.archivos.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-4 py-4">
                <span>
                  <span className="block font-semibold">{f.nombre}</span>
                  <span className="text-label text-fg-muted">
                    {f.tipo} · modificado {shortDate(f.modificado)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <form action={permisoDrive} className="mt-6">
            <input type="hidden" name="permitir" value="0" />
            <button
              type="submit"
              className="inline-flex h-11 items-center rounded-full border border-border-strong px-5 text-label font-semibold"
            >
              Quitar el permiso
            </button>
          </form>
        </>
      )}
    </CuentaFrame>
  );
}
