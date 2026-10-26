import { notConnected } from "@/lib/not-connected";

import type { PaymentProviderPort } from "../../ports/payment-provider-port";

/**
 * To connect: Recurrente's checkout API in sandbox first, with the test keys and the webhook secret in
 * `.env.local` (RECURRENTE_PUBLIC_KEY, RECURRENTE_SECRET_KEY, RECURRENTE_WEBHOOK_SECRET). The webhook
 * route already verifies the signature and ignores repeated events.
 */
export const createRealRecurrente = () => notConnected<PaymentProviderPort>("Recurrente");
