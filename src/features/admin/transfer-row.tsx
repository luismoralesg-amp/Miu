"use client";

import { CircleAlert, CircleCheck, FileText } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/design-system/components";
import { quetzales } from "@/lib/clock";
import { cx } from "@/lib/cx";
import type { QueuedTransfer } from "@/modules/finance";
import type { ReviewState } from "@/app/(app)/admin/pagos/actions";

/** One receipt to review: approve in one click; reject asks for the reason the student will read. */
export function TransferRow({
  t,
  cuando,
  destacado,
  action,
}: {
  t: QueuedTransfer;
  cuando: string;
  destacado: boolean;
  action: (prev: ReviewState, form: FormData) => Promise<ReviewState>;
}) {
  const [state, submit, pending] = useActionState(action, {});
  const [rechazando, setRechazando] = useState(false);
  const revisada = t.estado !== "pendiente" || Boolean(state.ok);
  return (
    <li
      id={`transferencia-${t.id}`}
      aria-label={`Comprobante de ${t.alumno}`}
      className={cx(
        "flex flex-col gap-4 py-5 md:flex-row md:items-start md:justify-between",
        destacado && "-mx-3 rounded-xl bg-surface px-3",
      )}
    >
      <div className="min-w-0">
        <p className="font-semibold">
          {t.alumno} <span className="font-normal text-fg-muted tabular">· {t.carne}</span>
        </p>
        <p className="text-label text-fg-muted">
          {t.concepto} · {t.banco} · boleta <span className="tabular">{t.boleta}</span> · {cuando}
        </p>
        <p className="mt-1 inline-flex items-center gap-1.5 text-label text-fg-muted">
          <FileText aria-hidden="true" className="size-4" />
          Comprobante adjunto
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
        <p className="display text-[28px] leading-none tabular">{quetzales(t.monto)}</p>
        {revisada ? (
          <p
            role="status"
            className={cx(
              "flex items-center gap-1.5 text-label font-medium",
              t.estado === "rechazada" || state.ok?.startsWith("Rechazada")
                ? "text-danger-fg"
                : "text-success-fg",
            )}
          >
            <CircleCheck aria-hidden="true" className="size-4" />
            {state.ok ?? (t.estado === "aprobada" ? "Aprobada" : "Rechazada")}
          </p>
        ) : (
          <form action={submit} className="flex flex-col items-start gap-2 md:items-end">
            {rechazando && (
              <label className="flex w-full flex-col gap-1 text-label font-medium md:w-80">
                Motivo del rechazo
                <input
                  name="motivo"
                  autoFocus
                  className="h-11 rounded-md border border-border-control bg-surface px-3 font-normal"
                  placeholder="Ej.: el monto no coincide con la boleta"
                />
              </label>
            )}
            {state.error && (
              <p role="alert" className="flex items-center gap-1.5 text-label text-danger-fg">
                <CircleAlert aria-hidden="true" className="size-4" />
                {state.error}
              </p>
            )}
            <div className="flex gap-2">
              {rechazando ? (
                <>
                  <Button type="button" variant="ghost" onClick={() => setRechazando(false)}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    name="decision"
                    value="rechazar"
                    variant="danger"
                    loading={pending}
                  >
                    Rechazar
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="secondary" onClick={() => setRechazando(true)}>
                    Rechazar…
                  </Button>
                  <Button
                    type="submit"
                    name="decision"
                    value="aprobar"
                    variant="ink"
                    loading={pending}
                    aria-label={`Aprobar comprobante de ${t.alumno}`}
                  >
                    Aprobar
                  </Button>
                </>
              )}
            </div>
          </form>
        )}
      </div>
    </li>
  );
}
