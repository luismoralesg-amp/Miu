import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleAlert } from "lucide-react";

import { PortProblem } from "@/design-system/components";
import { requirePermission } from "@/authz/server";
import { MethodForm } from "@/features/pagos/method-form";
import { longDate, quetzales } from "@/lib/clock";
import { withFault } from "@/lib/fault";
import { ledger } from "@/modules/finance";
import { requireActor } from "@/modules/identity/session";
import { payments } from "@/modules/payments";

import { enviarComprobante, iniciarPago } from "../../actions";

export const metadata: Metadata = { title: "Pagar" };

type Props = {
  params: Promise<{ cargoId: string }>;
  searchParams: Promise<{ metodo?: string; error?: string }>;
};

const METHODS = ["ach", "tarjeta", "apple_pay", "comprobante", "caja"] as const;

/** Paying a charge in two steps: choose the method here, pay on the provider's hosted page. */
export default async function PagarPage({ params, searchParams }: Props) {
  await requirePermission("pay");
  const actor = await requireActor();
  const { cargoId } = await params;
  const sp = await searchParams;
  const charge = await withFault("ledger", () => ledger().getCharge(actor, cargoId));
  if (!charge.ok && charge.error === "not_found") notFound();
  const back = (
    <Link
      href="/pagos"
      className="inline-flex min-h-11 items-center gap-1.5 text-label font-medium text-fg-muted hover:text-fg"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      Pagos
    </Link>
  );
  if (!charge.ok)
    return (
      <div className="py-10">
        {back}
        <PortProblem error={charge.error} what="el cargo" />
      </div>
    );
  const c = charge.value;
  const quotes =
    c.estado === "pendiente"
      ? await withFault("payments", () => payments().quoteAll(c.monto))
      : null;
  const inicial = METHODS.find((m) => m === sp.metodo) ?? "ach";

  return (
    <div className="pt-8 pb-10 md:pt-10">
      {back}
      <section className="pt-2 pb-8">
        <p className="text-[15px] text-fg-muted">
          Referencia <span className="tabular">{c.referencia}</span> · vence el{" "}
          {longDate(new Date(`${c.vence}T12:00:00-06:00`))}
        </p>
        <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium md:text-[56px]">
          {c.concepto} · {quetzales(c.monto)}
        </h1>
      </section>
      {sp.error === "pago" && (
        <p
          role="alert"
          className="mb-6 flex items-center gap-2 rounded-lg bg-danger-soft px-4 py-3 text-[15px] text-danger-fg"
        >
          <CircleAlert aria-hidden="true" className="size-5" />
          El pago no se completó y no se te cobró nada. Puedes intentarlo de nuevo.
        </p>
      )}
      {c.estado !== "pendiente" ? (
        <p className="rounded-[20px] border border-border p-6 text-[15px]">
          {c.estado === "pagado"
            ? "Este cargo ya está pagado. Tu recibo está en Pagos."
            : "Este cargo tiene un comprobante en revisión. Te avisamos cuando lo aprueben."}{" "}
          <Link href="/pagos" className="underline underline-offset-4">
            Volver a Pagos
          </Link>
        </p>
      ) : !quotes?.ok ? (
        <PortProblem error={quotes?.error ?? "unavailable"} what="las formas de pago" />
      ) : (
        <MethodForm
          quotes={quotes.value}
          inicial={inicial}
          referencia={c.referencia}
          pay={iniciarPago.bind(null, c.id)}
          upload={enviarComprobante.bind(null, c.id)}
        />
      )}
    </div>
  );
}
