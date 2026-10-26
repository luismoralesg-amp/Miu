import { selectAdapter } from "@/lib/adapters";

import { MockIdentity } from "./adapters/mock/mock-identity";
import { RealIdentity } from "./adapters/real/real-identity";
import type { IdentityPort } from "./ports/identity-port";

export type { ClientInfo, IdentityPort, SignedIn } from "./ports/identity-port";
export * from "./domain/types";
export { maskEmail, normalizeUfmEmail } from "./domain/rules";

/** MIU_ADAPTER_IDENTITY=mock|real. One instance per server process, so sessions survive hot reloads. */
export function identity(): IdentityPort {
  return selectAdapter<IdentityPort>("identity", {
    mock: () => new MockIdentity(),
    real: () => new RealIdentity(),
  });
}
