import { notConnected } from "@/lib/not-connected";

import type { ConferencePort } from "../../ports/conference-port";

/** To connect: MiU's conference catalog and reservations (or fce2 through the identity proxy). */
export const createRealConferences = () => notConnected<ConferencePort>("Conferencias de MiU");
