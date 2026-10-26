import { selectAdapter } from "@/lib/adapters";
import { guarded } from "@/lib/result";

import { MockRecurrente } from "./adapters/mock/mock-recurrente";
import { createRealRecurrente } from "./adapters/real/real-recurrente";
import { createStripe } from "./adapters/real/stripe";
import type { PaymentProviderPort } from "./ports/payment-provider-port";

export type { PaymentPolicy, PaymentProviderPort } from "./ports/payment-provider-port";
export * from "./domain/types";
export { fee, quote, routeByCost } from "./domain/rules";

function mockProvider() {
  return selectAdapter<MockRecurrente>("payments-mock", {
    mock: () => new MockRecurrente(),
    real: () => new MockRecurrente(),
  });
}

/** MIU_ADAPTER_PAYMENTS=mock|real (Recurrente); MIU_PAYMENTS_PROVIDER=stripe picks the empty Stripe. */
export function payments(): PaymentProviderPort {
  return selectAdapter<PaymentProviderPort>("payments", {
    mock: () => guarded(mockProvider()),
    real: () =>
      guarded(
        process.env.MIU_PAYMENTS_PROVIDER === "stripe" ? createStripe() : createRealRecurrente(),
      ),
  });
}

/**
 * Mock only: pays a checkout the way Recurrente's hosted page would, by sending the signed webhook
 * through the same handler as the real endpoint. Returns null with a real provider.
 */
export async function simulateHostedPayment(checkoutId: string) {
  if (process.env.MIU_ADAPTER_PAYMENTS === "real") return null;
  const event = mockProvider().buildPaidEvent(checkoutId);
  if (!event) return null;
  return payments().handleWebhook(event.body, event.signature);
}
