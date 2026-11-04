import type { Metadata } from "next";
import { CircleCheck, TriangleAlert } from "lucide-react";

import { requirePermission } from "@/authz/server";
import { Badge, PortProblem } from "@/design-system/components";
import { PagosTabs } from "@/features/admin/pagos-tabs";
import { cap, plural, shortDate } from "@/features/shared/format";
import { quetzales } from "@/lib/clock";
import { withFault } from "@/lib/fault";
import { ledger, reconcile } from "@/modules/finance";
import { requireActor } from "@/modules/identity/session";
import { payments } from "@/modules/payments";

export const metadata: Metadata = { title: "Conciliación" };

/** MiU's receipts against what Recurrente says it settled, by reference. */
export default async function ConciliacionPage() {
  await requirePermission("approve_payment");
  const actor = await requireActor();
  const [mine, theirs] = await Promise.all([
    withFault("ledger", () => ledger().listPayments(actor)),
    withFault("payments", () => payments().listSettlements(actor)),
  ]);
  const problem = !mine.ok ? mine : !theirs.ok ? theirs : null;
  const report =
    mine.ok && theirs.ok
      ? reconcile(
          mine.value
            .filter((p) => p.metodo === "ach" || p.metodo === "tarjeta" || p.metodo === "apple_pay")
            .map((p) => ({
              referencia: p.id,
              total: p.total,
              fecha: p.fecha,
              numero: p.numero,
              concepto: p.concepto,
            })),
          theirs.value,
        )
      : null;
  const open = report
    ? report.diferencias.length + report.soloMiu.length + report.soloProveedor.length
    : 0;

  return (
    <div className="pb-10">
      <section className="reveal pt-10 pb-8 md:pt-14 md:pb-10">
        <p className="text-[15px] text-fg-muted">
          {report
            ? open === 0
              ? "Todo cuadra con Recurrente"
              : `${plural(open, "diferencia", "diferencias")} por revisar`
            : "Pagos con tarjeta y ACH"}
        </p>
        <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium md:text-[64px]">
          Conciliación
        </h1>
      </section>
      <PagosTabs />
      {problem && !problem.ok ? (
        <PortProblem error={problem.error} what="los pagos" className="border-y border-border" />
      ) : report ? (
        <div className="flex flex-col gap-10">
          <Group
            id="solo-proveedor"
            titulo="Solo en Recurrente"
            ayuda="Recurrente cobró y MiU no tiene recibo. Pídele el detalle del evento y registra el pago, o gestiona el reembolso allá."
            tone="danger"
            rows={report.soloProveedor.map((r) => ({
              key: r.referencia,
              titulo: r.referencia,
              detalle: `${cap(r.metodo === "apple_pay" ? "Apple Pay" : r.metodo === "ach" ? "ACH" : r.metodo)} · ${shortDate(r.fecha)}`,
              total: r.total,
            }))}
          />
          <Group
            id="solo-miu"
            titulo="Solo en MiU"
            ayuda="MiU tiene el recibo y Recurrente no lo liquidó. Revisa si el pago sigue en tránsito."
            tone="warning"
            rows={report.soloMiu.map((r) => ({
              key: r.referencia,
              titulo: `${r.concepto} · ${r.numero}`,
              detalle: shortDate(r.fecha),
              total: r.total,
            }))}
          />
          <Group
            id="diferencias"
            titulo="Con otro monto"
            ayuda="Ambos lo tienen, pero el total no coincide."
            tone="warning"
            rows={report.diferencias.map((r) => ({
              key: r.miu.referencia,
              titulo: `${r.miu.concepto} · ${r.miu.numero}`,
              detalle: `MiU ${quetzales(r.miu.total)} · Recurrente ${quetzales(r.proveedor.total)}`,
              total: r.miu.total,
            }))}
          />
          <Group
            id="conciliados"
            titulo="Conciliados"
            ayuda=""
            tone="success"
            rows={report.conciliados.map((r) => ({
              key: r.miu.referencia,
              titulo: `${r.miu.concepto} · ${r.miu.numero}`,
              detalle: shortDate(r.miu.fecha),
              total: r.miu.total,
            }))}
          />
          <p className="max-w-prose text-caption text-fg-muted">
            El extracto de Recurrente es de ejemplo en esta demostración; incluye un evento sin
            recibo para mostrar cómo se ve una diferencia.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Group({
  id,
  titulo,
  ayuda,
  tone,
  rows,
}: {
  id: string;
  titulo: string;
  ayuda: string;
  tone: "danger" | "warning" | "success";
  rows: Array<{ key: string; titulo: string; detalle: string; total: number }>;
}) {
  if (rows.length === 0) return null;
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="flex items-center gap-2.5 pb-1 display text-[28px] font-medium">
        {titulo} <span className="text-fg-muted tabular">{rows.length}</span>
        <Badge
          tone={tone}
          icon={
            tone === "success" ? (
              <CircleCheck aria-hidden="true" />
            ) : (
              <TriangleAlert aria-hidden="true" />
            )
          }
        >
          {tone === "success" ? "Cuadra" : "Revisar"}
        </Badge>
      </h2>
      {ayuda && <p className="max-w-prose pb-3 text-label text-fg-muted">{ayuda}</p>}
      <ul className="divide-y divide-border border-y border-border">
        {rows.map((r) => (
          <li
            key={r.key}
            className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-4"
          >
            <div className="min-w-0">
              <p className="font-medium">{r.titulo}</p>
              <p className="text-label text-fg-muted">{r.detalle}</p>
            </div>
            <p className="display text-[24px] leading-none tabular">{quetzales(r.total)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
