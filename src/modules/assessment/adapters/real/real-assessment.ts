import { notConnected } from "@/lib/not-connected";

import type { AssessmentPort } from "../../ports/assessment-port";

/**
 * To connect: MiU's API for activities, submissions (files go through StoragePort) and grades. Grades
 * and closes must be written with the grader's identity so the audit trail stays complete.
 */
export const createRealAssessment = () => notConnected<AssessmentPort>("API de evaluación de MiU");
