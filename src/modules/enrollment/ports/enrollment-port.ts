import type { PortResult } from "@/lib/result";
import type { Actor } from "@/modules/identity";

import type {
  EnrollmentWindow,
  OfferCourse,
  Preference,
  SavedPreferences,
  StepUp,
} from "../domain/types";

/** Course assignment for next term and dropping a current course (`real`: MiU). */
export interface EnrollmentPort {
  getWindow(actor: Actor): PortResult<EnrollmentWindow>;
  listOffer(actor: Actor): PortResult<OfferCourse[]>;
  getPreferences(actor: Actor): PortResult<SavedPreferences>;
  /** Sends a fresh one-time code to confirm a sensitive change (step-up). */
  requestStepUp(actor: Actor): PortResult<StepUp>;
  savePreferences(actor: Actor, prefs: Preference[], codigo: string): PortResult<SavedPreferences>;
  drop(
    actor: Actor,
    courseId: string,
    codigo: string,
  ): PortResult<{ courseId: string; fecha: string }>;
  listDropped(actor: Actor): PortResult<string[]>;
}
