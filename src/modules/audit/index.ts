import { selectAdapter } from "@/lib/adapters";
import { guarded } from "@/lib/result";

import { MockAudit } from "./adapters/mock/mock-audit";
import { createRealAudit } from "./adapters/real/real-audit";
import type { AuditPort } from "./ports/audit-port";

export type { AuditPort } from "./ports/audit-port";
export * from "./domain/types";

/** MIU_ADAPTER_AUDIT=mock|real. */
export function audit(): AuditPort {
  return selectAdapter<AuditPort>("audit", {
    mock: () => guarded(new MockAudit()),
    real: () => guarded(createRealAudit()),
  });
}
