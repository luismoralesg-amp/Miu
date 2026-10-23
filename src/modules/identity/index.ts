import { MockIdentity } from "./adapters/mock/mock-identity";
import { RealIdentity } from "./adapters/real/real-identity";
import type { IdentityPort } from "./ports/identity-port";

export type { ClientInfo, IdentityPort, SignedIn } from "./ports/identity-port";
export * from "./domain/types";
export { maskEmail, normalizeUfmEmail } from "./domain/rules";

// One instance per server process; kept on globalThis so dev hot reloads don't drop sessions.
const globalForIdentity = globalThis as unknown as { miuIdentity?: IdentityPort };

export function identity(): IdentityPort {
  globalForIdentity.miuIdentity ??=
    process.env.MIU_ADAPTER_IDENTITY === "real" ? new RealIdentity() : new MockIdentity();
  return globalForIdentity.miuIdentity;
}
