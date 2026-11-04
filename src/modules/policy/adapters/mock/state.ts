import { POLICY, buildSeed } from "@/mock/seed";
import type { Actor } from "@/modules/identity";

import type { PolicyValues } from "../../domain/types";

type State = { values: PolicyValues; grants: Set<string> };

const registry = globalThis as unknown as { miuPolicy?: Map<string, State> };
const initial = (): State => ({
  values: structuredClone({
    umbralJustificacion: POLICY.umbralJustificacion,
    metas: POLICY.metas,
    comisionTarjeta: POLICY.comisionTarjeta,
  }),
  grants: new Set(),
});

let seeded: Set<string> | undefined;
const isSeedAccount = (userId: string) => {
  seeded ??= new Set(buildSeed().people.flatMap((p) => (p.userId ? [p.userId] : [])));
  return seeded.has(userId);
};

/**
 * Policy of the demo accounts is shared (it is institutional); every other account, such as an E2E
 * test account, gets its own copy so one run never changes another's rules.
 */
export function stateFor(actor?: Pick<Actor, "userId">): State {
  registry.miuPolicy ??= new Map();
  const key = actor && !isSeedAccount(actor.userId) ? `user:${actor.userId}` : "shared";
  let s = registry.miuPolicy.get(key);
  if (!s) registry.miuPolicy.set(key, (s = initial()));
  return s;
}

/** Tests only. */
export function resetPolicyState() {
  registry.miuPolicy?.clear();
}

export const grantKey = (personId: string, sectionId: string) => `${personId}:${sectionId}`;
