"use client";

import { CircleAlert, CircleCheck, Lock } from "lucide-react";
import { useActionState } from "react";

import { Button, Checkbox } from "@/design-system/components";
import { plural } from "@/features/shared/format";
import type { CloseState } from "@/app/(app)/catedra/cierre/actions";

/** The one irreversible step of a section: confirm what will not count, then close. */
export function CloseForm({
  sectionId,
  nombre,
  programadas,
  cerrada,
  action,
}: {
  sectionId: string;
  nombre: string;
  /** Titles of the activities that haven't happened yet. */
  programadas: string[];
  /** Already closed: only the confirmation shows, and it stays mounted so the close is announced. */
  cerrada: boolean;
  action: (prev: CloseState, form: FormData) => Promise<CloseState>;
}) {
  const [state, submit, pending] = useActionState(action, {});
  if (state.ok || cerrada)
    return (
      <p role="status" className="flex items-start gap-1.5 text-label text-fg-muted">
        <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success-fg" />
        {state.ok ??
          "La nota final quedó cerrada y registrada en la auditoría. Ya no se puede calificar ni publicar en esta sección."}
      </p>
    );
  return (
    <form action={submit} className="flex flex-col items-start gap-4">
      <input type="hidden" name="sectionId" value={sectionId} />
      {programadas.length > 0 && (
        <Checkbox
          name="confirmo"
          required
          label={`Entiendo que ${plural(programadas.length, "actividad", "actividades")} sin realizar no contará${programadas.length === 1 ? "" : "n"}`}
          description={programadas.join(" · ")}
        />
      )}
      {state.error && (
        <p role="alert" className="flex items-center gap-1.5 text-label text-danger-fg">
          <CircleAlert aria-hidden="true" className="size-4" />
          {state.error}
        </p>
      )}
      <Button
        type="submit"
        variant="ink"
        pill
        size="lg"
        loading={pending}
        icon={<Lock aria-hidden="true" />}
        aria-label={`Cerrar la nota final de ${nombre}`}
      >
        Cerrar nota final
      </Button>
      <p className="text-label text-fg-muted">
        Después del cierre no se puede calificar ni publicar en esta sección.
      </p>
    </form>
  );
}
