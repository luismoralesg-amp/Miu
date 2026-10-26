import { z } from "zod";

import { academicNow } from "@/lib/clock";
import { parsed } from "@/lib/contract";
import { fail, type PortResult } from "@/lib/result";
import type { Actor } from "@/modules/identity";

import { AuditEntry, AuditInput } from "../../domain/types";
import type { AuditPort } from "../../ports/audit-port";

/** In-memory, append-only. Entries are frozen when written. */
export class MockAudit implements AuditPort {
  private readonly entries: AuditEntry[] = [];

  constructor(private readonly now: () => Date = academicNow) {}

  async record(actor: Actor, input: AuditInput): PortResult<AuditEntry> {
    const body = AuditInput.safeParse(input);
    if (!body.success) return fail("invalid", body.error.issues[0]?.message);
    const entry = Object.freeze({
      ...body.data,
      id: `aud-${this.entries.length + 1}`,
      fecha: new Date(this.now().getTime() + this.entries.length).toISOString(),
      actorId: actor.personId,
      actorNombre: actor.nombre,
      rol: actor.role,
    });
    this.entries.push(entry);
    return parsed(AuditEntry, entry);
  }

  async query(actor: Actor, scope: { sectionIds?: string[] }) {
    const visible =
      actor.role === "administrativo"
        ? this.entries
        : actor.role === "maestro"
          ? this.entries.filter((e) => e.sectionId && scope.sectionIds?.includes(e.sectionId))
          : this.entries.filter((e) => e.actorId === actor.personId && e.rol === actor.role);
    return parsed(z.array(AuditEntry), [...visible].reverse());
  }
}
