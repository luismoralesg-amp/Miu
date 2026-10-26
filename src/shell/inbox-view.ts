import type { InboxItem } from "@/modules/inbox";

/** What the bell shows: the inbox itself, never a second count. */
export function bellBadge(items: readonly InboxItem[]) {
  return {
    count: items.length,
    label: items.length ? `Bandeja, ${items.length} por atender` : "Bandeja",
  };
}
