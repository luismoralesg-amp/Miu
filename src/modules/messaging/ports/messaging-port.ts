import type { PortResult } from "@/lib/result";
import type { Actor } from "@/modules/identity";

import type { Thread, ThreadSummary } from "../domain/types";

/** In-app messages with the people of your courses (`real`: fce2 through the identity proxy). */
export interface MessagingPort {
  listThreads(actor: Actor): PortResult<ThreadSummary[]>;
  /** Opens (or starts) the conversation with someone the actor shares a course with. */
  getThread(actor: Actor, personaId: string): PortResult<Thread>;
  send(actor: Actor, personaId: string, texto: string): PortResult<Thread>;
}
