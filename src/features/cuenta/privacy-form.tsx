"use client";

import { CircleCheck } from "lucide-react";
import { useState, useTransition } from "react";

import { Button, Switch } from "@/design-system/components";
import type { Privacy } from "@/modules/account";
import { guardarPrivacidad } from "@/app/(app)/cuenta/actions";

const ITEMS: Array<[keyof Privacy, string, string]> = [
  [
    "directorio",
    "Aparecer en el directorio de personas",
    "Otros estudiantes podrían buscarte por nombre.",
  ],
  ["foto", "Mostrar mi foto", "Se ve en mensajes y en las listas de tus cursos."],
  ["horario", "Compartir mi horario", "Tus compañeros de curso verían tus clases, no tus notas."],
  ["correoAvisos", "Recibir avisos por correo", "Además de la campana de MiU."],
];

/** Everything that exposes you is off by default; changes save with one button. */
export function PrivacyForm({ initial }: { initial: Privacy }) {
  const [p, setP] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div className="flex max-w-xl flex-col gap-2">
      {ITEMS.map(([k, label, description]) => (
        <Switch
          key={k}
          label={label}
          description={description}
          checked={p[k]}
          onCheckedChange={(v) => {
            setP({ ...p, [k]: v });
            setSaved(false);
          }}
        />
      ))}
      <div className="mt-4 flex items-center gap-4">
        <Button
          variant="ink"
          loading={pending}
          onClick={() =>
            start(async () => {
              const r = await guardarPrivacidad(p);
              setSaved(Boolean("ok" in r && r.ok));
            })
          }
        >
          Guardar
        </Button>
        {saved && (
          <p role="status" className="flex items-center gap-2 text-label text-success-fg">
            <CircleCheck aria-hidden="true" className="size-4" />
            Guardado.
          </p>
        )}
      </div>
    </div>
  );
}
