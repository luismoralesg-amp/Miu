import { selectAdapter } from "@/lib/adapters";
import { guarded } from "@/lib/result";

import { MockSupport } from "./adapters/mock/mock-support";
import { createRealSupport } from "./adapters/real/real-support";
import type { SupportChatPort } from "./ports/support-port";

export type { SupportChatPort } from "./ports/support-port";
export * from "./domain/types";

/** MIU_ADAPTER_SUPPORT=mock|real. */
export function support(): SupportChatPort {
  return selectAdapter<SupportChatPort>("support", {
    mock: () => guarded(new MockSupport()),
    real: () => guarded(createRealSupport()),
  });
}
