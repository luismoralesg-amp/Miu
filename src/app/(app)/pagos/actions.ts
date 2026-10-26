"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { can } from "@/authz";
import { subjectFor } from "@/authz/subject";
import { ledger } from "@/modules/finance";
import { requireActor } from "@/modules/identity/session";
import { ProviderMethod, payments, simulateHostedPayment } from "@/modules/payments";

export type PayState = { error?: string };

/** Step 1 → 2: open the provider's hosted checkout for this charge and method. */
export async function iniciarPago(
  chargeId: string,
  _prev: PayState,
  form: FormData,
): Promise<PayState> {
  const actor = await requireActor();
  if (!can(await subjectFor(actor), "pay", { ownerId: actor.personId }))
    return { error: "No puedes pagar este cargo." };
  const metodo = ProviderMethod.safeParse(form.get("metodo"));
  if (!metodo.success) return { error: "Elige cómo quieres pagar." };
  const checkout = await payments().createCheckout(actor, { chargeId, metodo: metodo.data });
  if (!checkout.ok)
    return {
      error:
        checkout.error === "invalid"
          ? (checkout.detail ?? "Este cargo ya no se puede pagar.")
          : "No pudimos abrir el pago. No se cobró nada; inténtalo de nuevo.",
    };
  redirect(checkout.value.url as never);
}

/**
 * Mock of the provider's hosted page: "Pagar" sends the same signed webhook Recurrente would, through
 * the real handler, then returns to MiU. With the real provider this page does not exist.
 */
export async function confirmarPagoSimulado(checkoutId: string, cargoId: string) {
  await requireActor();
  const result = await simulateHostedPayment(checkoutId);
  if (!result || !result.ok) redirect(`/pagos/pagar/${cargoId}?error=pago` as never);
  // The bell and Hoy read the same ledger: refresh the shell, not only the page.
  revalidatePath("/", "layout");
  redirect(`/pagos/pagar/${cargoId}/listo?checkout=${checkoutId}` as never);
}

/** Transfer with receipt: the charge goes to review and the Administrativo's queue. */
export async function enviarComprobante(
  chargeId: string,
  _prev: PayState & { ok?: boolean },
  form: FormData,
) {
  const actor = await requireActor();
  if (!can(await subjectFor(actor), "pay", { ownerId: actor.personId }))
    return { error: "No puedes pagar este cargo." };
  const archivo = form.get("comprobante");
  const banco = String(form.get("banco") ?? "").trim();
  const boleta = String(form.get("boleta") ?? "").trim();
  if (banco.length < 2) return { error: "Escribe el banco desde el que pagaste." };
  if (boleta.length < 3) return { error: "Escribe el número de boleta o de transferencia." };
  if (!(archivo instanceof File) || archivo.size === 0)
    return { error: "Adjunta el comprobante (foto o PDF)." };
  const result = await ledger().submitTransfer(actor, {
    chargeId,
    banco,
    boleta,
    archivo: archivo.name,
  });
  if (!result.ok)
    return {
      error:
        result.error === "invalid"
          ? (result.detail ?? "Revisa los datos del comprobante.")
          : "No pudimos enviarlo. Inténtalo de nuevo.",
    };
  revalidatePath("/", "layout");
  redirect("/pagos?comprobante=enviado" as never);
}
