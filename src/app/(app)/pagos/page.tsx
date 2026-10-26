import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, Clock, Download, ShieldCheck } from "lucide-react";

import { PortProblem } from "@/design-system/components";
import { requirePermission } from "@/authz/server";
import { METHOD_COPY } from "@/features/pagos/methods";
import { cap, route, shortDate } from "@/features/shared/format";
import { longDate, quetzales } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { withFault } from "@/lib/fault";
import { ledger, type Receipt } from "@/modules/finance";
import { requireActor } from "@/modules/identity/session";
import { payments } from "@/modules/payments";

export const metadata: Metadata = { title: "Pagos" };

type Props = { searchParams: Promise<{ comprobante?: string }> };

const ESTADO: Record<Receipt["estado"], { label: string; tone: string; icon: typeof CircleCheck }> =
  {
    pagado: { label: "Pagado", tone: "text-success-fg", icon: CircleCheck },
    revision: { label: "En revisión", tone: "text-warning-fg", icon: Clock },
    rechazado: { label: "Rechazado", tone: "text-danger-fg", icon: Clock },
    reembolsado: { label: "Reembolsado", tone: "text-fg-muted", icon: CircleCheck },
  };

/** What you owe, the cheapest way to pay it first, and every payment you made. */
export default async function PagosPage({ searchParams }: Props) {
  await requirePermission("view_payments");
  const actor = await requireActor();
  const enviado = (await searchParams).comprobante === "enviado";
  const [balance, receipts] = await Promise.all([
    withFault("ledger", () => ledger().getBalance(actor)),
    withFault("ledger", () => ledger().listReceipts(actor)),
  ]);
  const proximo = balance.ok ? balance.value.proximo : null;
  const policy = await payments().getPolicy();
  const fee = policy.ok ? policy.value : { porcentaje: 4.5, fijo: 2, bancosAch: [] as string[] };
  const quotes = proximo
    ? await withFault("payments", () => payments().quoteAll(proximo.monto))
    : null;
  const ach = quotes?.ok ? quotes.value.find((q) => q.metodo === "ach") : undefined;
  const card = quotes?.ok ? quotes.value.find((q) => q.metodo === "tarjeta") : undefined;

  return (
    <div className="pb-10">
      <section className="reveal pt-10 pb-8 md:pt-14 md:pb-10">
        <p className="text-[15px] text-fg-muted">{actor.nombre}</p>
        <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium md:text-[64px]">
          Pagos
        </h1>
      </section>

      {enviado && (
        <p
          role="status"
          className="mb-6 flex items-center gap-2 rounded-lg bg-success-soft px-4 py-3 text-[15px] text-success-fg"
        >
          <CircleCheck aria-hidden="true" className="size-5" />
          Recibimos tu comprobante. Lo revisan en 1 a 2 días hábiles; mientras tanto, el cargo queda
          en revisión.
        </p>
      )}

      {!balance.ok ? (
        <PortProblem error={balance.error} what="tu saldo" className="border-y border-border" />
      ) : !proximo ? (
        <section aria-labelledby="estado-t" className="reveal border-y border-border py-10">
          <h2
            id="estado-t"
            className="flex items-center gap-3 display text-[34px] font-medium md:text-[44px]"
          >
            <ShieldCheck aria-hidden="true" className="size-8 text-success-fg" />
            Estás al día
          </h2>
          <p className="mt-2 text-[15px] text-fg-muted">
            No tienes cargos pendientes. Tu solvencia está vigente para asignación y documentos.
          </p>
        </section>
      ) : (
        <>
          <section aria-labelledby="estado-t" className="reveal border-y border-border py-10">
            <h2 id="estado-t" className="sr-only">
              Lo que debes
            </h2>
            <p className="text-[17px] md:text-xl">
              <span className="text-fg-muted">Debes </span>
              <span className="display text-[44px] tabular md:text-[64px]">
                {quetzales(balance.value.saldo)}
              </span>
              <span className="text-fg-muted">
                {" "}
                · {proximo.concepto.toLowerCase()} vence el{" "}
                {longDate(new Date(`${proximo.vence}T12:00:00-06:00`))},{" "}
                {proximo.diasParaVencer === 0
                  ? "hoy"
                  : proximo.diasParaVencer === 1
                    ? "mañana"
                    : `en ${proximo.diasParaVencer} días`}
              </span>
            </p>
            <details className="mt-4 max-w-[520px] text-[15px]">
              <summary className="inline-flex min-h-11 cursor-pointer items-center gap-1 font-medium">
                Ver el desglose
              </summary>
              <dl className="mt-2 tabular">
                {proximo.desglose.map((d) => (
                  <div
                    key={d.concepto}
                    className="flex justify-between border-b border-border py-2"
                  >
                    <dt className="text-fg-muted">{d.concepto}</dt>
                    <dd>{quetzales(d.monto)}</dd>
                  </div>
                ))}
                <div className="flex justify-between py-2 font-semibold">
                  <dt>Total</dt>
                  <dd>{quetzales(proximo.monto)}</dd>
                </div>
              </dl>
            </details>
          </section>

          {ach && card && (
            <section
              aria-labelledby="como-t"
              className="grid reveal gap-10 border-b border-border py-10 md:grid-cols-12 md:gap-0 md:divide-x md:divide-border"
            >
              <div className="md:col-span-7 md:pr-12">
                <h2 id="como-t" className="display text-[28px] font-medium md:text-[34px]">
                  {METHOD_COPY.ach.titulo}
                </h2>
                <p className="mt-2 text-[15px] text-fg-muted">
                  Sin comisión. {METHOD_COPY.ach.detalle}
                </p>
                <ol className="mt-6 flex flex-col gap-4 text-[15px]">
                  {[
                    <>
                      Toca <b className="font-semibold">Pagar con transferencia ACH</b>.
                    </>,
                    <>Elige tu banco ({fee.bancosAch.join(", ")} y más) y autoriza el débito.</>,
                    <>Vuelves a MiU con el recibo listo. Tu solvencia se actualiza sola.</>,
                  ].map((paso, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="w-5 shrink-0 display text-xl leading-6 tabular">
                        {i + 1}
                      </span>
                      <span>{paso}</span>
                    </li>
                  ))}
                </ol>
                <Link
                  href={route(`/pagos/pagar/${proximo.id}?metodo=ach`)}
                  className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent-to px-6 font-semibold text-on-accent transition-transform duration-(--duration-press) ease-(--ease-out) active:scale-[0.97] sm:w-auto"
                >
                  Pagar {quetzales(ach.total)} con transferencia ACH
                </Link>
              </div>
              <div className="md:col-span-5 md:pl-12">
                <h3 className="text-lg font-semibold">Tarjeta o Apple Pay</h3>
                <p className="mt-1 text-[15px] text-fg-muted">Al instante con Visa o Mastercard.</p>
                <dl className="mt-4 text-[15px] tabular">
                  <div className="flex justify-between border-b border-border py-2">
                    <dt className="text-fg-muted">
                      Comisión ({fee.porcentaje}% + Q{fee.fijo})
                    </dt>
                    <dd>{quetzales(card.comision)}</dd>
                  </div>
                  <div className="flex justify-between py-2 font-semibold">
                    <dt>Total con tarjeta</dt>
                    <dd>{quetzales(card.total)}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-label text-fg-muted">
                  Con transferencia ACH pagas{" "}
                  <b className="font-semibold text-fg">{quetzales(ach.ahorro)}</b> menos.
                </p>
                <Link
                  href={route(`/pagos/pagar/${proximo.id}?metodo=tarjeta`)}
                  className="mt-5 inline-flex h-11 items-center rounded-full border border-fg px-5 text-[15px] font-semibold transition-transform duration-(--duration-press) ease-(--ease-out) active:scale-[0.97]"
                >
                  Pagar {quetzales(card.total)} con tarjeta
                </Link>
                <details className="mt-8 border-t border-border pt-4">
                  <summary className="flex min-h-11 cursor-pointer items-center justify-between text-[15px] font-medium">
                    Otras formas de pagar
                  </summary>
                  <div className="mt-3 flex flex-col gap-4 text-[15px]">
                    <p>
                      <b className="font-semibold">Transferencia con comprobante.</b>{" "}
                      <span className="text-fg-muted">
                        Usa la referencia{" "}
                        <code className="font-semibold text-fg tabular">{proximo.referencia}</code>{" "}
                        y{" "}
                        <Link
                          href={route(`/pagos/pagar/${proximo.id}?metodo=comprobante`)}
                          className="underline underline-offset-4"
                        >
                          sube el comprobante
                        </Link>
                        . Revisión de 1 a 2 días hábiles.
                      </span>
                    </p>
                    <p>
                      <b className="font-semibold">Pago en caja.</b>{" "}
                      <span className="text-fg-muted">
                        Edificio Académico, de lunes a viernes de 07:00 a 17:00. Presenta la misma
                        referencia.
                      </span>
                    </p>
                  </div>
                </details>
              </div>
            </section>
          )}
        </>
      )}

      <section aria-labelledby="hist-t" className="reveal py-10">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="hist-t" className="display text-[28px] font-medium md:text-[34px]">
            Historial
          </h2>
          <span className="flex gap-4">
            <Link
              href="/pagos/recibos"
              className="inline-flex min-h-11 items-center text-label font-medium text-fg-muted hover:text-fg"
            >
              Recibos
            </Link>
            <Link
              href="/pagos/estado-de-cuenta"
              className="inline-flex min-h-11 items-center text-label font-medium text-fg-muted hover:text-fg"
            >
              Estado de cuenta
            </Link>
          </span>
        </div>
        {!receipts.ok ? (
          <PortProblem error={receipts.error} what="tu historial" />
        ) : (
          <ul className="mt-4 divide-y divide-border border-t border-border tabular">
            {receipts.value.map((r) => {
              const e = ESTADO[r.estado];
              return (
                <li
                  key={r.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 py-4 md:grid-cols-[7rem_1fr_auto_9rem_2.75rem] md:gap-x-6"
                >
                  <span className="order-3 text-label text-fg-muted md:order-none">
                    {shortDate(r.fecha)} {r.fecha.slice(0, 4)}
                    <span className="md:hidden"> · {r.detalleMetodo}</span>
                  </span>
                  <span className="order-1 min-w-0 md:order-none">
                    <span className="block font-medium">{r.concepto}</span>
                    <span className="hidden text-label text-fg-muted md:block">
                      {r.detalleMetodo}
                    </span>
                  </span>
                  <span className="order-2 text-right font-semibold md:order-none">
                    {quetzales(r.total)}
                  </span>
                  <span
                    className={cx(
                      "order-4 flex items-center justify-end gap-1.5 text-label font-medium md:order-none md:justify-start",
                      e.tone,
                    )}
                  >
                    <e.icon aria-hidden="true" className="size-4" />
                    {e.label}
                  </span>
                  <span className="order-5 col-start-2 justify-self-end md:col-start-auto">
                    {r.estado === "pagado" && (
                      <a
                        href={`/api/recibos/${r.id}`}
                        download
                        aria-label={`Descargar recibo de ${r.concepto.toLowerCase()}`}
                        className="grid size-11 place-items-center rounded-full transition-colors duration-150 hover:bg-surface-subtle"
                      >
                        <Download aria-hidden="true" className="size-[18px]" />
                      </a>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-6 text-caption text-fg-muted">
          {cap(
            `la comisión de tarjeta (${fee.porcentaje}% + Q${fee.fijo}) la paga quien paga; está pendiente de confirmar con la UFM.`,
          )}
        </p>
      </section>
    </div>
  );
}
