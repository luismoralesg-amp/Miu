import type { PortResult } from "@/lib/result";
import type { Actor } from "@/modules/identity";

import type {
  Appeal,
  Batch,
  BatchEntry,
  Gradebook,
  GradeInput,
  QueueItem,
  StudentActivity,
  Submission,
  SubmitInput,
} from "../domain/types";

/**
 * Activities, submissions and grades. `mock` keeps changes per signed-in user on top of the seed;
 * `real` will use MiU's API (docs/INTEGRACIONES_PENDIENTES.md).
 */
export interface AssessmentPort {
  /** The student's activities this term, with their status. */
  listActivities(actor: Actor, filter?: { courseId?: string }): PortResult<StudentActivity[]>;
  getActivity(actor: Actor, activityId: string): PortResult<StudentActivity>;
  /** Hands in work; returns the receipt with the file's SHA-256. */
  submit(actor: Actor, activityId: string, input: SubmitInput): PortResult<Submission>;
  getGradebook(actor: Actor): PortResult<Gradebook>;
  /** Teaching roles: activities with submissions to grade in the actor's sections. */
  listGradingQueue(actor: Actor): PortResult<QueueItem[]>;
  listBatch(actor: Actor, sectionId: string, activityId: string): PortResult<Batch>;
  /** Saves one grade. Under the threshold it needs a justification. */
  gradeSubmission(actor: Actor, input: GradeInput): PortResult<BatchEntry>;
  /** Publishes every saved grade of the batch; students get a notice. */
  publishGrades(
    actor: Actor,
    sectionId: string,
    activityId: string,
  ): PortResult<{ publicadas: number }>;
  closeFinalGrade(actor: Actor, sectionId: string): PortResult<{ cerrada: true; fecha: string }>;
  isClosed(actor: Actor, sectionId: string): PortResult<boolean>;
  listAppeals(actor: Actor): PortResult<Appeal[]>;
  createAppeal(actor: Actor, input: { activityId: string; motivo: string }): PortResult<Appeal>;
}
