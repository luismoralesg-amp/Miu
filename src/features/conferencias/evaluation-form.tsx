"use client";

import { CircleAlert } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/design-system/components";
import type { EvalState } from "@/app/(app)/conferencias/actions";

const LABELS = ["Muy mala", "Mala", "Regular", "Buena", "Excelente"];

/** Five labeled choices (not stars: each value says what it means) and an optional comment. */
export function EvaluationForm({
  action,
}: {
  action: (prev: EvalState, form: FormData) => Promise<EvalState>;
}) {
  const [state, submit, pending] = useActionState(action, {});
  return (
    <form action={submit} className="flex max-w-xl flex-col gap-6">
      <fieldset>
        <legend className="font-semibold">¿Cómo estuvo la conferencia?</legend>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {LABELS.map((l, i) => (
            <label
              key={l}
              className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-border p-3 text-center text-caption has-[:checked]:border-fg has-[:checked]:bg-surface has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus"
            >
              <input type="radio" name="calificacion" value={i + 1} className="sr-only" />
              <span className="display text-[24px] tabular">{i + 1}</span>
              {l}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-1.5 font-semibold">
        Comentario{" "}
        <span className="text-label font-normal text-fg-muted">
          Opcional; lo leen los organizadores.
        </span>
        <textarea
          name="comentario"
          rows={4}
          maxLength={600}
          className="rounded-md border border-border-control bg-surface p-3 text-body font-normal"
        />
      </label>
      {state.error && (
        <p role="alert" className="flex items-center gap-2 text-label text-danger-fg">
          <CircleAlert aria-hidden="true" className="size-4" />
          {state.error}
        </p>
      )}
      <Button type="submit" variant="ink" size="lg" pill loading={pending} className="self-start">
        Enviar evaluación
      </Button>
    </form>
  );
}
