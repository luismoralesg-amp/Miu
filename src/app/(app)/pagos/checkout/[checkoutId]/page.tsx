import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlaskConical, Lock } from "lucide-react";

import { Button } from "@/design-system/components";
import { requirePermission } from "@/authz/server";
import { METHOD_COPY } from "@/features/pagos/methods";
import { quetzales } from "@/lib/clock";
import { requireActor } from "@/modules/identity/session";
import { payments } from "@/modules/payments";

import { confirmarPagoSimulado } from "../../actions";

export const metadata: Metadata = { title: "Checkout de prueba" };

type Props = { params: Promise<{ checkoutId: string }> };

/**
 * Stand-in for Recurrente's hosted checkout (step 2). It is clearly marked as a simulation and asks
 * for no card or bank data; with the real provider the student is sent to Recurrente instead.
 */
export default async function CheckoutPage({ params }: Props) {
  await requirePermission("pay");
  const actor = await requireActor();
  const { checkoutId } = await params;
  const checkout = await payments().getCheckout(actor, checkoutId);
  if (!checkout.ok) notFound();
  const c = checkout.value;
  const policy = await payments().getPolicy();
  return (
    <div className="mx-auto max-w-lg py-12">
      <p className="flex items-center gap-2 rounded-lg bg-warning-soft px-4 py-3 text-label text-warning-fg">
        <FlaskConical aria-hidden="true" className="size-4 shrink-0" />
        Simulación del checkout de Recurrente. No escribas datos reales: aquí no se cobra nada.
      </p>
      <section
        aria-labelledby="chk-t"
        className="mt-6 rounded-[20px] border border-border bg-surface p-8"
      >
        <p className="text-label text-fg-muted">Paso 2 de 2 · Recurrente</p>
        <h1 id="chk-t" className="mt-1 display text-[34px] font-medium">
          {quetzales(c.total)}
        </h1>
        <p className="text-[15px] text-fg-muted">
          {c.concepto} · {METHOD_COPY[c.metodo].titulo}
          {c.comision > 0 && ` · incluye ${quetzales(c.comision)} de comisión`}
        </p>
        <form
          action={confirmarPagoSimulado.bind(null, c.id, c.chargeId)}
          className="mt-6 flex flex-col gap-4"
        >
          {c.metodo === "ach" && (
            <label className="flex flex-col gap-1.5 text-label font-medium">
              Tu banco
              <select
                name="banco"
                className="h-12 rounded-md border border-border-control bg-surface px-3 text-body font-normal"
              >
                {(policy.ok ? policy.value.bancosAch : []).map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </label>
          )}
          <Button type="submit" variant={c.metodo === "ach" ? "primary" : "ink"} size="lg" pill>
            Pagar {quetzales(c.total)}
          </Button>
          <p className="flex items-center gap-2 text-caption text-fg-muted">
            <Lock aria-hidden="true" className="size-3.5" />
            Recurrente confirma el pago a MiU con un aviso firmado.
          </p>
        </form>
      </section>
    </div>
  );
}
