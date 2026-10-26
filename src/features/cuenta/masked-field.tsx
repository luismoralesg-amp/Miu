"use client";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";

import { revelar, pedirCodigoCuenta } from "@/app/(app)/cuenta/actions";

import { StepUp } from "../asignacion/step-up";

/**
 * A sensitive value that arrives masked from the server. Showing it asks for a fresh code, then the
 * server sends the full value once; it hides itself again after 30 s.
 */
export function MaskedField({
  campo,
  label,
  masked,
}: {
  campo: "cui" | "nacimiento";
  label: string;
  masked: string;
}) {
  const [value, setValue] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  useEffect(() => {
    if (!value) return;
    const t = window.setTimeout(() => setValue(null), 30_000);
    return () => window.clearTimeout(t);
  }, [value]);
  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-center gap-2">
        <span className="font-medium tabular" aria-live="polite">
          {value ?? (
            <>
              <span aria-hidden="true">{masked}</span>
              <span className="sr-only">
                {label} oculto,{" "}
                {masked.replace(/•+/g, "").trim()
                  ? `termina en ${masked.replace(/[•/\s]+/g, " ").trim()}`
                  : ""}
              </span>
            </>
          )}
        </span>
        <button
          type="button"
          onClick={() => (value ? setValue(null) : setAsking(true))}
          aria-label={value ? `Ocultar ${label}` : `Mostrar ${label}`}
          className="grid size-9 place-items-center rounded-full text-fg-muted hover:bg-surface-subtle hover:text-fg"
        >
          {value ? (
            <EyeOff aria-hidden="true" className="size-4" />
          ) : (
            <Eye aria-hidden="true" className="size-4" />
          )}
        </button>
      </span>
      {asking && (
        <StepUp
          request={pedirCodigoCuenta}
          label={`Mostrar ${label}`}
          onCancel={() => setAsking(false)}
          onConfirm={async (codigo) => {
            const r = await revelar(campo, codigo);
            if ("error" in r && r.error) return r.error;
            setValue(r.valor ?? null);
            setAsking(false);
            return undefined;
          }}
        />
      )}
    </div>
  );
}
