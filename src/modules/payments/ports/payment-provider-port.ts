import type { PortResult } from "@/lib/result";
import type { Actor } from "@/modules/identity";

import type { Checkout, ProviderMethod, Quote, WebhookResult } from "../domain/types";

/**
 * The card/ACH processor. Card data never touches MiU: the student pays on the provider's hosted
 * checkout (SAQ A) and the provider confirms through a signed webhook.
 */
export interface PaymentProviderPort {
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
  refund(
    actor: Actor,
    reciboId: string,
    monto: number,
  ): PortResult<{ id: string; estado: "solicitado" }>;
}
