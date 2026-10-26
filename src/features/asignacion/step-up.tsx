"use client";

import { CircleAlert, ShieldCheck } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/design-system/components";
import { pedirCodigo } from "@/app/(app)/asignacion/actions";

/**
 * Inline step-up (no pop-up): ask for a fresh code, type it, confirm. The confirm callback runs the
 * sensitive change with that code and returns an error to show, or nothing.
 */
export function StepUp({
  label,
  onConfirm,
  onCancel,
}: {
  label: string;
  onConfirm: (codigo: string) => Promise<string | undefined>;
  onCancel: () => void;
}) {
  const [sent, setSent] = useState<{ codigoPrueba?: string } | null>(null);
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return (
    <div
      className="flex flex-col gap-3 rounded-[16px] border border-fg bg-surface p-5"
      role="group"
      aria-label="Confirmar que eres tú"
    >
      <p className="flex items-center gap-2 font-semibold">
        <ShieldCheck aria-hidden="true" className="size-5" />
        Confirma que eres tú
      </p>
      {!sent ? (
        <>
          <p className="text-label text-fg-muted">
            Te mandamos un código a tu correo de la UFM para confirmar este cambio.
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              variant="ink"
              loading={pending}
              onClick={() =>
                start(async () => {
                  const r = await pedirCodigo();
                  if (!r.ok) setError(r.error);
                  else setSent(r.codigoPrueba ? { codigoPrueba: r.codigoPrueba } : {});
                })
              }
            >
              Enviarme el código
            </Button>
          </div>
        </>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const err = await onConfirm(codigo);
              if (err) setError(err);
            });
          }}
        >
          {sent.codigoPrueba && (
            <p className="rounded-md border border-dashed border-border-strong p-3 text-label">
              Correo de prueba · solo en desarrollo · código{" "}
              <span data-testid="codigo-step-up" className="font-semibold tabular">
                {sent.codigoPrueba}
              </span>
            </p>
          )}
          <label className="flex flex-col gap-1.5 text-label font-medium">
            Código de 6 dígitos
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              className="h-12 w-40 rounded-md border border-border-control bg-bg px-3 text-xl tracking-widest tabular"
            />
          </label>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" variant="ink" loading={pending} disabled={codigo.length !== 6}>
              {label}
            </Button>
          </div>
        </form>
      )}
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-label text-danger-fg">
          <CircleAlert aria-hidden="true" className="size-4" />
          {error}
        </p>
      )}
    </div>
  );
}
