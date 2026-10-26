import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, Download } from "lucide-react";

import { requirePermission } from "@/authz/server";
import { cap, route } from "@/features/shared/format";
import { hhmm, longDate, quetzales } from "@/lib/clock";
import { ledger } from "@/modules/finance";
import { requireActor } from "@/modules/identity/session";
import { payments } from "@/modules/payments";

export const metadata: Metadata = { title: "Pago recibido" };

type Props = { params: Promise<{ cargoId: string }>; searchParams: Promise<{ checkout?: string }> };

/** Back from the provider: the receipt, and what changed (solvency). */
export default async function PagoListo({ searchParams }: Props) {
  await requirePermission("pay");
  const actor = await requireActor();
  const checkoutId = (await searchParams).checkout ?? "";
  const checkout = await payments().getCheckout(actor, checkoutId);
  if (!checkout.ok || checkout.value.estado !== "pagado") notFound();
  const [receipts, solvency] = await Promise.all([
    ledger().listReceipts(actor),
    ledger().isSolvent(actor),
  ]);
  const r = receipts.ok ? receipts.value.find((x) => x.id === checkout.value.reciboId) : undefined;
  if (!r) notFound();
  return (
    <div className="mx-auto max-w-xl py-12">
      <section
        aria-labelledby="ok-t"
        className="rounded-[20px] border border-border bg-surface p-8"
        data-testid="recibo-pago"
      >
        <CircleCheck aria-hidden="true" className="size-8 text-success-fg" />
        <h1 id="ok-t" className="mt-3 display text-[34px] font-medium">
          Pagaste {quetzales(r.total)}
        </h1>
        <p role="status" className="mt-1 text-[15px] text-fg-muted">
          {r.concepto} · {r.detalleMetodo}
          {solvency.ok && solvency.value.solvente && " · tu solvencia está al día"}
        </p>
        <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[15px] tabular">
          <dt className="text-fg-muted">Recibo</dt>
          <dd className="font-semibold">{r.numero}</dd>
          <dt className="text-fg-muted">Fecha</dt>
          <dd>
            {cap(longDate(new Date(r.fecha)))}, {hhmm(new Date(r.fecha))}
          </dd>
          <dt className="text-fg-muted">Monto</dt>
          <dd>{quetzales(r.monto)}</dd>
          {r.comision > 0 && (
            <>
              <dt className="text-fg-muted">Comisión</dt>
              <dd>{quetzales(r.comision)}</dd>
            </>
          )}
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={`/api/recibos/${r.id}`}
            download
            className="inline-flex h-11 items-center gap-2 rounded-full bg-fg px-5 text-[15px] font-semibold text-bg"
          >
            <Download aria-hidden="true" className="size-4" />
            Descargar recibo
          </a>
          <Link
            href={route("/pagos")}
            className="inline-flex h-11 items-center rounded-full border border-border px-5 text-[15px] font-medium"
          >
            Volver a Pagos
          </Link>
        </div>
      </section>
    </div>
  );
}
