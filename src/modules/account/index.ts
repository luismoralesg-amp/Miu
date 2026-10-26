import { selectAdapter } from "@/lib/adapters";
import { guarded } from "@/lib/result";

import { MockAccount } from "./adapters/mock/mock-account";
import { createRealAccount } from "./adapters/real/real-account";
import type { AccountPort } from "./ports/account-port";

export type { AccountPort } from "./ports/account-port";
export * from "./domain/types";
export { maskBirth, maskCui, maskPhone } from "./domain/rules";

/** MIU_ADAPTER_ACCOUNT=mock|real. */
export function account(): AccountPort {
  return selectAdapter<AccountPort>("account", {
    mock: () => guarded(new MockAccount()),
    real: () => guarded(createRealAccount()),
  });
}
