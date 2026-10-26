import { selectAdapter } from "@/lib/adapters";
import { guarded } from "@/lib/result";

import { MockAssessment } from "./adapters/mock/mock-assessment";
import { createRealAssessment } from "./adapters/real/real-assessment";
import type { AssessmentPort } from "./ports/assessment-port";

export type { AssessmentPort } from "./ports/assessment-port";
export * from "./domain/types";
export * from "./domain/rules";

/** MIU_ADAPTER_ASSESSMENT=mock|real. */
export function assessment(): AssessmentPort {
  return selectAdapter<AssessmentPort>("assessment", {
    mock: () => guarded(new MockAssessment()),
    real: () => guarded(createRealAssessment()),
  });
}
