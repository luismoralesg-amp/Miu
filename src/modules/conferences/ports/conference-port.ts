import type { PortResult } from "@/lib/result";
import type { Actor } from "@/modules/identity";

import type { Conference, EvaluationInput } from "../domain/types";

/** Talks the student can reserve and evaluate (`real`: MiU / fce2). */
export interface ConferencePort {
  search(actor: Actor, query?: string): PortResult<Conference[]>;
  listMine(actor: Actor): PortResult<Conference[]>;
  get(actor: Actor, id: string): PortResult<Conference>;
  reserve(actor: Actor, id: string): PortResult<Conference>;
  cancel(actor: Actor, id: string): PortResult<Conference>;
  submitEvaluation(actor: Actor, id: string, input: EvaluationInput): PortResult<Conference>;
}
