import type { PortResult } from "@/lib/result";
import type { Actor } from "@/modules/identity";

import type { Checkout, ProviderMethod, Quote, Settlement, WebhookResult } from "../domain/types";

/**
 * The card/ACH processor. Card data never touches MiU: the student pays on the provider's hosted
 * checkout (SAQ A) and the provider confirms through a signed webhook.
 */
export type PaymentPolicy = {
  porcentaje: number;
  fijo: number;
  pagador: "estudiante" | "universidad";
  /** Banks offered by the ACH checkout [S]. */
  bancosAch: string[];
};

export interface PaymentProviderPort {
  /** Fee rule and ACH banks, so screens never hard-code them. */
  getPolicy(): PortResult<PaymentPolicy>;
  quote(monto: number, metodo: ProviderMethod): PortResult<Quote>;
  /** Every method, cheapest first. */
  quoteAll(monto: number): PortResult<Quote[]>;
  createCheckout(
    actor: Actor,
    input: { chargeId: string; metodo: ProviderMethod },
  ): PortResult<Checkout>;
  getCheckout(actor: Actor, checkoutId: string): PortResult<Checkout>;
  /** Verifies the signature; a repeated event is acknowledged but never applied twice. */
  handleWebhook(rawBody: string, signature: string | null): PortResult<WebhookResult>;
  /** Administrativo: what the provider says it settled, to reconcile against MiU's receipts. */
  listSettlements(actor: Actor): PortResult<Settlement[]>;
  refund(
    actor: Actor,
    reciboId: string,
    monto: number,
  ): PortResult<{ id: string; estado: "solicitado" }>;
}
