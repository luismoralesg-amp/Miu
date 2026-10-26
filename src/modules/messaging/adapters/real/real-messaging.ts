import { notConnected } from "@/lib/not-connected";

import type { MessagingPort } from "../../ports/messaging-port";

/** To connect: fce2 messaging through MiU's identity proxy (no second login). */
export const createRealMessaging = () => notConnected<MessagingPort>("Mensajería fce2");
