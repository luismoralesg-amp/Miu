import type { Metadata } from "next";
import Link from "next/link";

import { CuentaFrame } from "@/features/cuenta/frame";
import { cap } from "@/features/shared/format";
import { hhmm, longDate } from "@/lib/clock";
import { identity } from "@/modules/identity";
import { requireUser } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Accesos" };

/** Where and when your account was used, newest first. */
export default async function AccesosPage() {
  const { user } = await requireUser();
  const devices = (await identity().listDevices(user.id)).sort((a, b) =>
    b.ultimaVez.localeCompare(a.ultimaVez),
  );
  return (
    <CuentaFrame title="Accesos" eyebrow="Dónde y cuándo se usó tu cuenta">
      <ol className="divide-y divide-border border-y border-border" aria-label="Accesos recientes">
        {devices.map((d) => (
          <li key={d.id} className="flex flex-col gap-0.5 py-4">
            <span className="font-semibold">{d.nombre}</span>
            <span className="text-label text-fg-muted">
              {d.navegador} · {d.lugar} · último acceso {cap(longDate(new Date(d.ultimaVez)))},{" "}
              {hhmm(new Date(d.ultimaVez))}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-[15px]">
        ¿No reconoces un acceso? Cierra esa sesión desde{" "}
        <Link href="/cuenta/dispositivos" className="underline underline-offset-4">
          Dispositivos
        </Link>
        .
      </p>
    </CuentaFrame>
  );
}
