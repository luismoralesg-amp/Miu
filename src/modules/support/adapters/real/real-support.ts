import { notConnected } from "@/lib/not-connected";

import type { SupportChatPort } from "../../ports/support-port";

/** To connect: providesupport (or the UFM's help desk) with a signed token carrying identity and context. */
export const createRealSupport = () => notConnected<SupportChatPort>("Chat de soporte");
