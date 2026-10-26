import { notConnected } from "@/lib/not-connected";

import type { CurriculumPort } from "../../ports/curriculum-port";

/** To connect: MiU's pensum for the student's career and year of entry, plus their approved courses. */
export const createRealCurriculum = () => notConnected<CurriculumPort>("Pensum de MiU");
