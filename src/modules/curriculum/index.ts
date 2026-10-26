import { selectAdapter } from "@/lib/adapters";
import { guarded } from "@/lib/result";

import { MockCurriculum } from "./adapters/mock/mock-curriculum";
import { createRealCurriculum } from "./adapters/real/real-curriculum";
import type { CurriculumPort } from "./ports/curriculum-port";

export type { CurriculumPort } from "./ports/curriculum-port";
export * from "./domain/types";
export { prerequisiteChain, statusOf, unlocks } from "./domain/rules";

/** MIU_ADAPTER_CURRICULUM=mock|real. */
export function curriculum(): CurriculumPort {
  return selectAdapter<CurriculumPort>("curriculum", {
    mock: () => guarded(new MockCurriculum()),
    real: () => guarded(createRealCurriculum()),
  });
}
