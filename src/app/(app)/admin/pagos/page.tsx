import type { Metadata } from "next";
import { PartyPopper } from "lucide-react";

import { EmptyState, PortProblem } from "@/design-system/components";
import { requirePermission } from "@/authz/server";
import { PagosTabs } from "@/features/admin/pagos-tabs";
import { TransferRow } from "@/features/admin/transfer-row";
import { plural } from "@/features/shared/format";
import { academicNow, quetzales, timeAgo } from "@/lib/clock";
import { withFault } from "@/lib/fault";
import { ledger } from "@/modules/finance";
import { requireActor } from "@/modules/identity/session";

import { revisarTransferencia } from "./actions";

export const metadata: Metadata = { title: "Pagos y conciliación" };

type Props = { searchParams: Promise<{ transferencia?: string }> };

/** The queue of transfer receipts waiting for a person: oldest first, reviewed ones below. */
export default async function AdminPagosPage({ searchParams }: Props) {
  await requirePermission("approve_payment");
  const actor = await requireActor();
  const destacado = (await searchParams).transferencia;
  const now = academicNow();
  const queue = await withFault("ledger", () => ledger().listTransferQueue(actor));
  const pend = queue.ok ? queue.value.filter((t) => t.estado === "pendiente") : [];
  const hechas = queue.ok ? queue.value.filter((t) => t.estado !== "pendiente") : [];
  return (
    <div className="pb-10">
      <section className="reveal pt-10 pb-8 md:pt-14 md:pb-10">
        <p className="text-[15px] text-fg-muted">
          {queue.ok
            ? `${plural(pend.length, "comprobante", "comprobantes")} por revisar · ${quetzales(pend.reduce((s, t) => s + t.monto, 0))}`
            : "Finanzas estudiantiles"}
        </p>
        <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium md:text-[64px]">
          Pagos y conciliación
        </h1>
      </section>
      <PagosTabs />
      {!queue.ok ? (
        <PortProblem error={queue.error} what="la cola" className="border-y border-border" />
      ) : (
        <>
          <section aria-labelledby="pend-t">
            <h2 id="pend-t" className="pb-3 display text-[28px] font-medium">
              Por revisar <span className="text-fg-muted tabular">{pend.length}</span>
            </h2>
            {pend.length === 0 ? (
              <div className="border-y border-border">
                <EmptyState
                  icon={<PartyPopper aria-hidden="true" />}
                  title="Cola al día"
                  description="No hay comprobantes esperando revisión."
                />
              </div>
            ) : (
              <ul className="divide-y divide-border border-y border-border">
                {pend.map((t) => (
                  <TransferRow
                    key={t.id}
                    t={t}
                    cuando={timeAgo(new Date(t.fecha), now)}
                    destacado={t.id === destacado}
                    action={revisarTransferencia.bind(null, t.id)}
                  />
                ))}
              </ul>
            )}
          </section>
          {hechas.length > 0 && (
            <section aria-labelledby="hechas-t" className="pt-10">
              <h2 id="hechas-t" className="pb-3 display text-[28px] font-medium">
                Revisadas <span className="text-fg-muted tabular">{hechas.length}</span>
              </h2>
              <ul className="divide-y divide-border border-y border-border">
                {hechas.map((t) => (
                  <TransferRow
                    key={t.id}
                    t={t}
                    cuando={timeAgo(new Date(t.fecha), now)}
                    destacado={false}
                    action={revisarTransferencia.bind(null, t.id)}
                  />
                ))}
              </ul>
            </section>
          )}
          <p className="mt-6 text-caption text-fg-muted">
            Cada aprobación o rechazo queda en la auditoría con tu nombre. Un reembolso nunca lo
            hace quien aprobó el pago.
          </p>
        </>
      )}
    </div>
  );
}
