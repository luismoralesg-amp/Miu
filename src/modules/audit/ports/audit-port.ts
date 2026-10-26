import type { PortResult } from "@/lib/result";
import type { Actor } from "@/modules/identity";

import type { AuditEntry, AuditInput } from "../domain/types";

/** Append-only trail of sensitive changes. Nothing is ever edited or deleted. */
export interface AuditPort {
  record(actor: Actor, input: AuditInput): PortResult<AuditEntry>;
  /**
   * Entries the actor may see: everything (Administrativo), their courses' sections (Maestro, by
   * the section ids given) or only their own actions (Auxiliar, Estudiante).
   */
  query(actor: Actor, scope: { sectionIds?: string[] }): PortResult<AuditEntry[]>;
}
