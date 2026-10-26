import { notConnected } from "@/lib/not-connected";

import type { AuditPort } from "../../ports/audit-port";

/** To connect: an append-only table (no UPDATE or DELETE grants) with the actor from the session. */
export const createRealAudit = () => notConnected<AuditPort>("Tabla de auditoría");
