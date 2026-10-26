import { notConnected } from "@/lib/not-connected";

import type { AcademicPort } from "../../ports/academic-port";

/**
 * To connect: read MiU's API (or its change-data feed) for enrollments, sections, schedule and course
 * content, map each response to the zod contracts in ../../domain/types.ts and pass the call's
 * AbortSignal to fetch. Until then every method answers `unavailable`.
 */
export const createRealAcademic = () => notConnected<AcademicPort>("API académica de MiU");
