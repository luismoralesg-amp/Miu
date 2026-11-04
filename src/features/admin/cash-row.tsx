"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/design-system/components";
import { quetzales } from "@/lib/clock";
import type { Charge } from "@/modules/finance";
import type { CashState } from "@/app/(app)/admin/pagos/caja/actions";

/** One open charge at the cashier, with the button that takes the payment. */
export function CashRow({
  carne,
  charge,
  vence,
  action,
}: {
  carne: string;
  charge: Charge;
  vence: string;
  action: (prev: CashState, form: FormData) => Promise<CashState>;
}) {
  const [state, submit, pending] = useActionState(action, {});
  return (
    <li
      aria-label={charge.concepto}
      className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-5"
    >
      <div className="min-w-0">
        <p className="font-semibold">{charge.concepto}</p>
        <p className="text-label text-fg-muted">
          Vence {vence} · referencia <span className="tabular">{charge.referencia}</span>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <p className="display text-[28px] leading-none tabular">{quetzales(charge.monto)}</p>
        {state.ok ? (
          <p
            role="status"
            className="flex items-center gap-1.5 text-label font-medium text-success-fg"
          >
            <CircleCheck aria-hidden="true" className="size-4" />
            {state.ok}
          </p>
        ) : (
          <form action={submit} className="flex items-center gap-3">
            <input type="hidden" name="carne" value={carne} />
            <input type="hidden" name="chargeId" value={charge.id} />
            {state.error && (
              <span role="alert" className="flex items-center gap-1 text-label text-danger-fg">
                <CircleAlert aria-hidden="true" className="size-4" />
                {state.error}
              </span>
            )}
            <Button
              type="submit"
              variant="ink"
              pill
              loading={pending}
              aria-label={`Cobrar ${charge.concepto} en caja`}
            >
              Cobrar en caja
            </Button>
          </form>
        )}
      </div>
    </li>
  );
}
