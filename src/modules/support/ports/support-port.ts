import type { PortResult } from "@/lib/result";
import type { Actor } from "@/modules/identity";

import type { ChatSession, Department, Faq } from "../domain/types";

/** Help: FAQ and a chat that opens with identity and context filled in (`real`: providesupport with a signed token). */
export interface SupportChatPort {
  listFaq(): PortResult<Faq[]>;
  openSession(
    actor: Actor,
    context: { departamento: Department; pantalla: string },
  ): PortResult<ChatSession>;
  send(actor: Actor, sessionId: string, texto: string): PortResult<ChatSession>;
}
