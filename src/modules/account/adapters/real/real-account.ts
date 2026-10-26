import { notConnected } from "@/lib/not-connected";

import type { AccountPort } from "../../ports/account-port";

/** To connect: MiU's profile service (masked fields served masked) and Google Drive with explicit consent. */
export const createRealAccount = () =>
  notConnected<AccountPort>("Perfil de MiU y Google Workspace");
