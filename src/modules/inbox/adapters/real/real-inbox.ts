import { notConnected } from "@/lib/not-connected";

import type { InboxPort } from "../../ports/inbox-port";

/**
 * To connect: MiU Nuevo's own read model (a table fed by domain events from the other ports), with
 * `listItems` and `count` reading the same view.
 */
export const createRealInbox = () => notConnected<InboxPort>("Read model de la bandeja");
