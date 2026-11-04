import { notConnected } from "@/lib/not-connected";

import type { PolicyPort } from "../../ports/policy-port";

/** To connect: the UFM's academic regulation and MiU's role administration, written with the admin's identity. */
export const createRealPolicy = () =>
  notConnected<PolicyPort>("Reglamento académico y roles de MiU");
