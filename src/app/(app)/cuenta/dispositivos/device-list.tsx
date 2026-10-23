"use client";

import { KeyRound, Laptop, LogOut, Smartphone } from "lucide-react";
import { useActionState, useState } from "react";

import { Badge, Button, Dialog } from "@/design-system/components";
import type { Device } from "@/modules/identity/domain/types";
import { cerrarSesion } from "@/app/(auth)/login/actions";

import { registrarPasskey, revocarDispositivo, type DeviceState } from "./actions";

type Row = Device & { actual: boolean };

function hace(iso: string, ahora: number) {
  const min = Math.round((ahora - Date.parse(iso)) / 6e4);
  if (min < 2) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

function Aviso({ state }: { state: DeviceState }) {
  if (state.error)
    return (
      <p role="alert" className="text-label text-danger-fg">
        {state.error}
      </p>
    );
  if (state.aviso)
    return (
      <p role="status" className="text-label text-success-fg">
        {state.aviso}
      </p>
    );
  return null;
}

export function DeviceList({ devices, ahora }: { devices: Row[]; ahora: number }) {
  const [state, revocar, pending] = useActionState(revocarDispositivo, {});
  const [passkey, registrar, registrando] = useActionState(registrarPasskey, {});
  const [porCerrar, setPorCerrar] = useState<Row | null>(null);

  return (
    <div className="mt-10">
      <div className="mb-4 min-h-6" aria-live="polite">
        <Aviso state={state} />
        <Aviso state={passkey} />
      </div>
      <ul className="divide-y divide-border border-y border-border">
        {devices.map((d) => {
          const Icono = /iOS|Android|iPhone/.test(`${d.nombre} ${d.navegador}`)
            ? Smartphone
            : Laptop;
          return (
            <li
              key={d.id}
              className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-4">
                <Icono aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-fg-muted" />
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {d.nombre}
                    {d.actual && <Badge tone="info">Este dispositivo</Badge>}
                    {d.credencial === "passkey" && (
                      <Badge icon={<KeyRound aria-hidden="true" />}>Passkey</Badge>
                    )}
                  </p>
                  <p className="text-label text-fg-muted">
                    {[
                      d.navegador !== d.nombre ? d.navegador : null,
                      d.lugar,
                      d.actual ? "en uso ahora" : `último uso ${hace(d.ultimaVez, ahora)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pl-10 sm:pl-0">
                {d.actual ? (
                  <>
                    {d.credencial !== "passkey" && (
                      <form action={registrar}>
                        <Button
                          type="submit"
                          size="sm"
                          loading={registrando}
                          icon={<KeyRound aria-hidden="true" />}
                        >
                          Registrar passkey
                        </Button>
                      </form>
                    )}
                    <form action={cerrarSesion}>
                      <Button
                        type="submit"
                        size="sm"
                        variant="ghost"
                        icon={<LogOut aria-hidden="true" />}
                      >
                        Cerrar sesión
                      </Button>
                    </form>
                  </>
                ) : (
                  <Button size="sm" onClick={() => setPorCerrar(d)}>
                    Cerrar sesión en este dispositivo
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog
        open={porCerrar !== null}
        onOpenChange={(open) => !open && setPorCerrar(null)}
        title={`¿Cerrar la sesión en ${porCerrar?.nombre ?? "este dispositivo"}?`}
        description="Tendrá que volver a entrar con tu correo. Si tenía una passkey, la quitamos."
        footer={
          <form
            action={(form) => {
              setPorCerrar(null);
              revocar(form);
            }}
            className="flex gap-2"
          >
            <input type="hidden" name="dispositivo" value={porCerrar?.id ?? ""} />
            <Button variant="ghost" onClick={() => setPorCerrar(null)}>
              Cancelar
            </Button>
            <Button type="submit" variant="danger" loading={pending}>
              Cerrar sesión
            </Button>
          </form>
        }
      />
    </div>
  );
}
