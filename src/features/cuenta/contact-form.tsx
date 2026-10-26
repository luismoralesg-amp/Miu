"use client";

import { CircleCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/design-system/components";
import { actualizarContacto, pedirCodigoCuenta } from "@/app/(app)/cuenta/actions";

import { StepUp } from "../asignacion/step-up";

type Contact = {
  telefono: string;
  direccion: string;
  emergenciaNombre: string;
  emergenciaTelefono: string;
};

/** Contact data edits inline; saving confirms with a code. */
export function ContactForm({ initial }: { initial: Contact }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initial);
  const [confirm, setConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const field = (k: keyof Contact, label: string) => (
    <label className="flex flex-col gap-1.5 text-label font-medium">
      {label}
      <input
        value={draft[k]}
        onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
        className="h-11 rounded-md border border-border-control bg-surface px-3 font-normal"
      />
    </label>
  );
  if (!editing)
    return (
      <div className="flex flex-col items-start gap-3">
        {saved && (
          <p role="status" className="flex items-center gap-2 text-label text-success-fg">
            <CircleCheck aria-hidden="true" className="size-4" />
            Datos de contacto actualizados.
          </p>
        )}
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Editar datos de contacto
        </Button>
      </div>
    );
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {field("telefono", "Teléfono")}
        {field("direccion", "Dirección")}
        {field("emergenciaNombre", "Contacto de emergencia")}
        {field("emergenciaTelefono", "Teléfono de emergencia")}
      </div>
      {confirm ? (
        <StepUp
          request={pedirCodigoCuenta}
          label="Confirmar y guardar"
          onCancel={() => setConfirm(false)}
          onConfirm={async (codigo) => {
            const r = await actualizarContacto(draft, codigo);
            if ("error" in r && r.error) return r.error;
            setConfirm(false);
            setEditing(false);
            setSaved(true);
            return undefined;
          }}
        />
      ) : (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setDraft(initial);
              setEditing(false);
            }}
          >
            Cancelar
          </Button>
          <Button variant="ink" onClick={() => setConfirm(true)}>
            Guardar
          </Button>
        </div>
      )}
    </div>
  );
}
