"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { can } from "@/authz";
import { subjectFor } from "@/authz/subject";
import { audit } from "@/modules/audit";
import { ledger } from "@/modules/finance";
import { requireActor } from "@/modules/identity/session";
import { payments } from "@/modules/payments";

export type RefundState = { error?: string; ok?: string };

const Form = z.object({ paymentId: z.string().min(1), motivo: z.string() });

/**
 * Refund a payment. Needs `refund_payment`, a written reason, and a person other than the one who
 * approved or took it. Card and ACH payments are also refunded at the provider.
 */
export async function reembolsar(_prev: RefundState, form: FormData): Promise<RefundState> {
  const body = Form.safeParse(Object.fromEntries(form));
  if (!body.success) return { error: "No se pudo identificar el pago." };
  const actor = await requireActor();
  if (!can(await subjectFor(actor), "refund_payment", {}))
    return { error: "Tu rol no puede reembolsar." };
  const list = await ledger().listPayments(actor);
  const payment = list.ok ? list.value.find((p) => p.id === body.data.paymentId) : undefined;
  if (!payment) return { error: "No encontramos este pago." };
  if (!payment.reembolsable)
    return { error: payment.motivoBloqueo ?? "Este pago no se puede reembolsar." };
  if (body.data.motivo.trim().length < 10)
    return { error: "Explica el motivo en al menos 10 caracteres." };

  if (payment.metodo === "ach" || payment.metodo === "tarjeta" || payment.metodo === "apple_pay") {
    const refunded = await payments().refund(actor, payment.id, payment.total);
    if (!refunded.ok) return { error: "El proveedor no aceptó el reembolso. Inténtalo de nuevo." };
  }
  const result = await ledger().refundPayment(actor, payment.id, body.data.motivo);
  if (!result.ok)
    return {
      error:
        (result.error === "invalid" || result.error === "forbidden") && result.detail
          ? result.detail
          : "No se pudo reembolsar. Inténtalo de nuevo.",
    };
  await audit().record(actor, {
    accion: "reembolso",
    recurso: payment.id,
    detalle: `Reembolsó ${payment.concepto} de ${payment.alumno} (recibo ${payment.numero})`,
    antes: "pagado",
    despues: "reembolsado",
    motivo: body.data.motivo.trim(),
  });
  revalidatePath("/", "layout");
  return { ok: "Reembolsado. La estudiante ya ve el cargo otra vez pendiente." };
}
