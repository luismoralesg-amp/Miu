import type { PortResult } from "@/lib/result";
import type { Actor } from "@/modules/identity";

import type { Inbox } from "../domain/types";

/**
 * One read model for the Bandeja and every badge. `listItems` and `count` run the same query, so the
 * number on the bell is always the length of the list.
 */
export interface InboxPort {
  listItems(actor: Actor): PortResult<Inbox>;
  count(actor: Actor): PortResult<number>;
  /** Notices leave the list once read; pending work and payments leave when they are done. */
  markRead(actor: Actor, itemId: string): PortResult<{ total: number }>;
  markAllRead(actor: Actor): PortResult<{ total: number }>;
}
