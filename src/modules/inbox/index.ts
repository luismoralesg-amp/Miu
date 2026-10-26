import { selectAdapter } from "@/lib/adapters";
import { guarded } from "@/lib/result";

import { MockInbox } from "./adapters/mock/mock-inbox";
import { createRealInbox } from "./adapters/real/real-inbox";
import type { InboxPort } from "./ports/inbox-port";

export type { InboxPort } from "./ports/inbox-port";
export * from "./domain/types";
export { sortInbox, summarize } from "./domain/rules";

/** MIU_ADAPTER_INBOX=mock|real. */
export function inbox(): InboxPort {
  return selectAdapter<InboxPort>("inbox", {
    mock: () => guarded(new MockInbox()),
    real: () => guarded(createRealInbox()),
  });
}
