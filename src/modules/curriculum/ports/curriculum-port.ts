import type { PortResult } from "@/lib/result";
import type { Actor } from "@/modules/identity";

import type { Pensum } from "../domain/types";

/** The student's curriculum with progress (`real`: MiU's pensum per career and year of entry). */
export interface CurriculumPort {
  getPensum(actor: Actor): PortResult<Pensum>;
}
