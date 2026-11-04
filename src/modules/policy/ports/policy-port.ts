import type { PortResult } from "@/lib/result";
import type { Actor } from "@/modules/identity";

import type { CloseGrant, GrantInput, PolicyValues } from "../domain/types";

/** Institutional policy and per-section grants. Only the Administrativo changes them. */
export interface PolicyPort {
  get(actor: Actor): PortResult<PolicyValues>;
  update(actor: Actor, values: unknown): PortResult<PolicyValues>;
  /** Every Auxiliar of every section, with whether they may close its final grade. */
  listCloseGrants(actor: Actor): PortResult<CloseGrant[]>;
  setCloseGrant(actor: Actor, input: GrantInput): PortResult<CloseGrant>;
}
