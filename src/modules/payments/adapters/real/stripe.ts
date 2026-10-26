import { notConnected } from "@/lib/not-connected";

import type { PaymentProviderPort } from "../../ports/payment-provider-port";

/** Alternative provider, empty on purpose (PLAN §6): same port, chosen with MIU_PAYMENTS_PROVIDER=stripe. */
export const createStripe = () => notConnected<PaymentProviderPort>("Stripe");
