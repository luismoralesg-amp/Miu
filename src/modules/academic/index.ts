import { selectAdapter } from "@/lib/adapters";
import { guarded } from "@/lib/result";

import { MockAcademic } from "./adapters/mock/mock-academic";
import { createRealAcademic } from "./adapters/real/real-academic";
import type { AcademicPort } from "./ports/academic-port";

export type { AcademicPort } from "./ports/academic-port";
export * from "./domain/types";

/** MIU_ADAPTER_ACADEMIC=mock|real. Every call gets the 10 s budget. */
export function academic(): AcademicPort {
  return selectAdapter<AcademicPort>("academic", {
    mock: () => guarded(new MockAcademic()),
    real: () => guarded(createRealAcademic()),
  });
}
