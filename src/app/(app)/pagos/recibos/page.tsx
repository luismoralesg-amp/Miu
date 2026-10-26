import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download, Receipt as ReceiptIcon } from "lucide-react";

import { EmptyState, PortProblem } from "@/design-system/components";
import { requirePermission } from "@/authz/server";
import { shortDate } from "@/features/shared/format";
import { quetzales } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { withFault } from "@/lib/fault";
import { ledger } from "@/modules/finance";
import { requireActor } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Recibos" };

const ESTADO = {
  pagado: "Pagado",
  revision: "En revisión",
  rechazado: "Rechazado",
  reembolsado: "Reembolsado",
} as const;

/** Every payment with its receipt number; paid ones download. */
export default async function RecibosPage() {
  await requirePermission("view_payments");
  const actor = await requireActor();
  const receipts = await withFault("ledger", () => ledger().listReceipts(actor));
  return (
    <div className="pt-8 pb-10 md:pt-10">
      <Link
        href="/pagos"
        className="inline-flex min-h-11 items-center gap-1.5 text-label font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Pagos
      </Link>
      <h1 className="pt-2 pb-8 display text-[40px] leading-[1.02] font-medium md:text-[56px]">
        Recibos
      </h1>
      {!receipts.ok ? (
        <PortProblem error={receipts.error} what="tus recibos" className="border-y border-border" />
      ) : receipts.value.length === 0 ? (
        <div className="border-y border-border">
          <EmptyState
            icon={<ReceiptIcon aria-hidden="true" />}
            title="Aún no tienes recibos"
            description="Cada pago que hagas deja su recibo aquí."
          />
        </div>
      ) : (
        <div
          className="overflow-x-auto focus-visible:outline-2"
          tabIndex={0}
          role="region"
          aria-label="Tabla con desplazamiento horizontal"
        >
          <table className="w-full min-w-[640px] text-left text-[15px] tabular">
            <caption className="sr-only">Recibos de pago</caption>
            <thead className="text-caption text-fg-muted">
              <tr className="border-y border-border">
                <th scope="col" className="py-3 pr-4 font-medium">
                  Recibo
                </th>
                <th scope="col" className="py-3 pr-4 font-medium">
                  Concepto
                </th>
                <th scope="col" className="py-3 pr-4 font-medium">
                  Fecha
                </th>
                <th scope="col" className="py-3 pr-4 text-right font-medium">
                  Total
                </th>
                <th scope="col" className="py-3 pr-4 font-medium">
                  Estado
                </th>
                <th scope="col" className="py-3 font-medium">
                  <span className="sr-only">Descargar</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {receipts.value.map((r) => (
                <tr key={r.id}>
                  <th scope="row" className="py-3.5 pr-4 font-semibold">
                    {r.numero}
                  </th>
                  <td className="py-3.5 pr-4">
                    {r.concepto}
                    <span className="block text-label text-fg-muted">{r.detalleMetodo}</span>
                  </td>
                  <td className="py-3.5 pr-4">
                    {shortDate(r.fecha)} {r.fecha.slice(0, 4)}
                  </td>
                  <td className="py-3.5 pr-4 text-right font-semibold">
                    {quetzales(r.total)}
                    {r.comision > 0 && (
                      <span className="block text-caption font-normal text-fg-muted">
                        incluye {quetzales(r.comision)}
                      </span>
                    )}
                  </td>
                  <td
                    className={cx(
                      "py-3.5 pr-4 text-label font-medium",
                      r.estado === "pagado" ? "text-success-fg" : "text-warning-fg",
                    )}
                  >
                    {ESTADO[r.estado]}
                  </td>
                  <td className="py-3.5">
                    {r.estado === "pagado" && (
                      <a
                        href={`/api/recibos/${r.id}`}
                        download
                        aria-label={`Descargar recibo ${r.numero}`}
                        className="grid size-11 place-items-center rounded-full hover:bg-surface-subtle"
                      >
                        <Download aria-hidden="true" className="size-[18px]" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
