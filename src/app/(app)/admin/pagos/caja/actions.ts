"use server";

import { z } from "zod";

import { can } from "@/authz";
import { subjectFor } from "@/authz/subject";
import { audit } from "@/modules/audit";
import { ledger } from "@/modules/finance";
import { requireActor } from "@/modules/identity/session";

export type CashState = { error?: string; ok?: string };

const Form = z.object({ carne: z.string().min(1), chargeId: z.string().min(1) });

/** Take a payment at the cashier. The charge is settled and the person who took it is on the audit trail. */
export async function cobrarEnCaja(_prev: CashState, form: FormData): Promise<CashState> {
  const body = Form.safeParse(Object.fromEntries(form));
  if (!body.success) return { error: "No se pudo identificar el cargo." };
  const actor = await requireActor();
  if (!can(await subjectFor(actor), "approve_payment", {}))
    return { error: "Tu rol no puede cobrar en caja." };
  const result = await ledger().registerCashPayment(actor, body.data);
  if (!result.ok)
    return {
      error:
        result.error === "invalid" && result.detail
          ? result.detail
          : "No se pudo registrar el cobro. Inténtalo de nuevo.",
    };
  await audit().record(actor, {
    accion: "aprobar_pago",
    recurso: result.value.id,
    detalle: `Cobró en caja ${result.value.concepto} (recibo ${result.value.numero})`,
    despues: `Q${result.value.total.toFixed(2)}`,
  });
  // No revalidation: the row that was just paid stays on screen with its confirmation; the next search is fresh.
  return { ok: `Cobrado. Recibo ${result.value.numero}.` };
}
