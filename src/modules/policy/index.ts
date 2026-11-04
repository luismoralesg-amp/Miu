import { selectAdapter } from "@/lib/adapters";
import { guarded } from "@/lib/result";
import { POLICY } from "@/mock/seed";
import type { Actor } from "@/modules/identity";

import { MockPolicy } from "./adapters/mock/mock-policy";
import { grantKey, stateFor } from "./adapters/mock/state";
import { createRealPolicy } from "./adapters/real/real-policy";
import type { PolicyPort } from "./ports/policy-port";
import type { PolicyValues } from "./domain/types";

export type { PolicyPort } from "./ports/policy-port";
export * from "./domain/types";
export { resetPolicyState } from "./adapters/mock/state";

/** MIU_ADAPTER_POLICY=mock|real. */
export function policy(): PolicyPort {
  return selectAdapter<PolicyPort>("policy", {
    mock: () => guarded(new MockPolicy()),
    real: () => guarded(createRealPolicy()),
  });
}

/**
 * The values other modules apply right now. Mock-only shortcut so adapters read what the
 * Administrativo set without an extra call; the real adapters read their own configuration.
 */
export function currentPolicy(actor?: Pick<Actor, "userId">): PolicyValues & {
  bancosAch: string[];
} {
  return { ...stateFor(actor).values, bancosAch: [...POLICY.bancosAch] };
}

/** Whether the Administrativo let this Auxiliar close the final grade of the section. */
export function hasCloseGrant(actor: Actor, sectionId: string): boolean {
  return (
    actor.role === "auxiliar" && stateFor(actor).grants.has(grantKey(actor.personId, sectionId))
  );
}

/** Sections whose final grade this Auxiliar may close. */
export function closeGrantSections(actor: Actor): string[] {
  if (actor.role !== "auxiliar") return [];
  const prefix = `${actor.personId}:`;
  return [...stateFor(actor).grants]
    .filter((k) => k.startsWith(prefix))
    .map((k) => k.slice(prefix.length));
}
