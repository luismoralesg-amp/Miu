"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { useActionState, useState } from "react";

import { Badge, Button } from "@/design-system/components";
import { methodLabel, type AdminPayment } from "@/modules/finance";
import { quetzales } from "@/lib/clock";
import type { RefundState } from "@/app/(app)/admin/pagos/reembolsos/actions";

/** One payment: refund it with a written reason, unless this person is the one who approved it. */
export function RefundRow({
  payment,
  fecha,
  action,
}: {
  payment: AdminPayment;
  fecha: string;
  action: (prev: RefundState, form: FormData) => Promise<RefundState>;
}) {
  const [state, submit, pending] = useActionState(action, {});
  const [open, setOpen] = useState(false);
  const refunded = payment.estado === "reembolsado" || Boolean(state.ok);
  return (
    <li aria-label={`${payment.concepto}, recibo ${payment.numero}`} className="py-5">
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{payment.concepto}</span>
            {refunded && <Badge tone="warning">Reembolsado</Badge>}
          </p>
          <p className="text-label text-fg-muted">
            {payment.alumno} · recibo <span className="tabular">{payment.numero}</span> ·{" "}
            {methodLabel[payment.metodo]} · {fecha}
          </p>
          {payment.motivoReembolso && (
            <p className="mt-1 text-label text-fg-muted">Motivo: {payment.motivoReembolso}</p>
          )}
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <p className="display text-[28px] leading-none tabular">{quetzales(payment.total)}</p>
          {state.ok && (
            <p
              role="status"
              className="flex items-center gap-1.5 text-label font-medium text-success-fg"
            >
              <CircleCheck aria-hidden="true" className="size-4" />
              {state.ok}
            </p>
          )}
          {!refunded && payment.reembolsable && !open && (
            <Button
              type="button"
              variant="secondary"
              pill
              onClick={() => setOpen(true)}
              aria-label={`Reembolsar ${payment.concepto}, recibo ${payment.numero}`}
            >
              Reembolsar…
            </Button>
          )}
          {!refunded && !payment.reembolsable && payment.motivoBloqueo && (
            <p className="max-w-64 text-label text-fg-muted md:text-right">
              {payment.motivoBloqueo}
            </p>
          )}
        </div>
      </div>
      {open && !refunded && (
        <form action={submit} className="mt-4 flex max-w-prose flex-col gap-3">
          <input type="hidden" name="paymentId" value={payment.id} />
          <label className="flex flex-col gap-1.5 text-label font-medium">
            Motivo del reembolso
            <textarea
              name="motivo"
              rows={2}
              required
              minLength={10}
              autoFocus
              className="rounded-md border border-border-control bg-surface px-3 py-2.5 font-normal"
              placeholder="Ej.: cobro duplicado confirmado con el banco"
            />
          </label>
          {state.error && (
            <p role="alert" className="flex items-center gap-1.5 text-label text-danger-fg">
              <CircleAlert aria-hidden="true" className="size-4" />
              {state.error}
            </p>
          )}
          <div className="flex gap-2">
            <Button key="cancel" type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button key="confirm" type="submit" variant="danger" pill loading={pending}>
              Confirmar reembolso
            </Button>
          </div>
        </form>
      )}
    </li>
  );
}
