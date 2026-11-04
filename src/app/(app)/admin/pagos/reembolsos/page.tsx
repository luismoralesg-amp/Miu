import type { Metadata } from "next";
import { Receipt } from "lucide-react";

import { requirePermission } from "@/authz/server";
import { EmptyState, PortProblem } from "@/design-system/components";
import { PagosTabs } from "@/features/admin/pagos-tabs";
import { RefundRow } from "@/features/admin/refund-row";
import { shortDate } from "@/features/shared/format";
import { withFault } from "@/lib/fault";
import { ledger } from "@/modules/finance";
import { requireActor } from "@/modules/identity/session";

import { reembolsar } from "./actions";

export const metadata: Metadata = { title: "Reembolsos" };

/** Payments that can be given back, and the ones that already were. Never by whoever approved the payment. */
export default async function ReembolsosPage() {
  await requirePermission("refund_payment");
  const actor = await requireActor();
  const list = await withFault("ledger", () => ledger().listPayments(actor));

  return (
    <div className="pb-10">
      <section className="reveal pt-10 pb-8 md:pt-14 md:pb-10">
        <p className="text-[15px] text-fg-muted">Una segunda persona, siempre</p>
        <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium md:text-[64px]">
          Reembolsos
        </h1>
      </section>
      <PagosTabs />
      {!list.ok ? (
        <PortProblem error={list.error} what="los pagos" className="border-y border-border" />
      ) : list.value.length === 0 ? (
        <div className="border-y border-border">
          <EmptyState
            icon={<Receipt aria-hidden="true" />}
            title="Sin pagos"
            description="Cuando se confirme un pago aparecerá aquí."
          />
        </div>
      ) : (
        <>
          <ul aria-label="Pagos" className="divide-y divide-border border-y border-border">
            {list.value.map((p) => (
              <RefundRow key={p.id} payment={p} fecha={shortDate(p.fecha)} action={reembolsar} />
            ))}
          </ul>
          <p className="mt-6 max-w-prose text-caption text-fg-muted">
            Quien aprobó o cobró un pago no puede reembolsarlo: lo hace otra persona. Los pagos con
            tarjeta o ACH también se reembolsan en Recurrente. Cada reembolso queda en la auditoría
            con su motivo.
          </p>
        </>
      )}
    </div>
  );
}
