import { selectAdapter } from "@/lib/adapters";
import { guarded } from "@/lib/result";

import { MockMessaging } from "./adapters/mock/mock-messaging";
import { createRealMessaging } from "./adapters/real/real-messaging";
import type { MessagingPort } from "./ports/messaging-port";

export type { MessagingPort } from "./ports/messaging-port";
export * from "./domain/types";

/** MIU_ADAPTER_MESSAGING=mock|real. */
export function messaging(): MessagingPort {
  return selectAdapter<MessagingPort>("messaging", {
    mock: () => guarded(new MockMessaging()),
    real: () => guarded(createRealMessaging()),
  });
}
