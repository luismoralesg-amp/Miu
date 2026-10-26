import { selectAdapter } from "@/lib/adapters";
import { guarded } from "@/lib/result";

import { MockEnrollment } from "./adapters/mock/mock-enrollment";
import { createRealEnrollment } from "./adapters/real/real-enrollment";
import type { EnrollmentPort } from "./ports/enrollment-port";

export type { EnrollmentPort } from "./ports/enrollment-port";
export * from "./domain/types";
export { checkPreferences, isValid, overlaps } from "./domain/rules";

/** MIU_ADAPTER_ENROLLMENT=mock|real. */
export function enrollment(): EnrollmentPort {
  return selectAdapter<EnrollmentPort>("enrollment", {
    mock: () => guarded(new MockEnrollment()),
    real: () => guarded(createRealEnrollment()),
  });
}
