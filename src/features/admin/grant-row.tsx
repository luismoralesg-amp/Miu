"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { useActionState } from "react";

import { Badge, Button } from "@/design-system/components";
import type { CloseGrant } from "@/modules/policy";
import type { GrantState } from "@/app/(app)/admin/roles/actions";

/** One Auxiliar of one section: whether they may close its final grade, and the button to change it. */
export function GrantRow({
  grant,
  action,
}: {
  grant: CloseGrant;
  action: (prev: GrantState, form: FormData) => Promise<GrantState>;
}) {
  const [state, submit, pending] = useActionState(action, {});
  return (
    <li
      aria-label={`${grant.nombre}, ${grant.curso} ${grant.seccion}`}
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4"
    >
      <div className="min-w-0">
        <p className="font-semibold">{grant.nombre}</p>
        <p className="text-label text-fg-muted">
          Auxiliar de {grant.curso} · Sección {grant.seccion}
        </p>
      </div>
      <form action={submit} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="personId" value={grant.personId} />
        <input type="hidden" name="sectionId" value={grant.sectionId} />
        <Badge tone={grant.otorgado ? "success" : "neutral"}>
          {grant.otorgado ? "Puede cerrar" : "Sin permiso"}
        </Badge>
        {state.error && (
          <span role="alert" className="flex items-center gap-1 text-label text-danger-fg">
            <CircleAlert aria-hidden="true" className="size-4" />
            {state.error}
          </span>
        )}
        {state.ok && (
          <span role="status" className="flex items-center gap-1 text-label text-success-fg">
            <CircleCheck aria-hidden="true" className="size-4" />
            {state.ok}
          </span>
        )}
        <Button
          type="submit"
          name="otorgar"
          value={grant.otorgado ? "no" : "si"}
          variant={grant.otorgado ? "secondary" : "ink"}
          pill
          loading={pending}
          aria-label={`${grant.otorgado ? "Quitar a" : "Otorgar a"} ${grant.nombre} cerrar la nota final de ${grant.curso} ${grant.seccion}`}
        >
          {grant.otorgado ? "Quitar" : "Otorgar"}
        </Button>
      </form>
    </li>
  );
}
