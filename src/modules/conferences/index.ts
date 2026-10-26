import { selectAdapter } from "@/lib/adapters";
import { guarded } from "@/lib/result";

import { MockConferences } from "./adapters/mock/mock-conferences";
import { createRealConferences } from "./adapters/real/real-conferences";
import type { ConferencePort } from "./ports/conference-port";

export type { ConferencePort } from "./ports/conference-port";
export * from "./domain/types";
export { EVALUATION_DAYS, statusOf } from "./domain/rules";

/** MIU_ADAPTER_CONFERENCES=mock|real. */
export function conferences(): ConferencePort {
  return selectAdapter<ConferencePort>("conferences", {
    mock: () => guarded(new MockConferences()),
    real: () => guarded(createRealConferences()),
  });
}
