import type { InboxItem, InboxKind } from "./types";

/** Payments first when urgent, then pending work by due date, then notices newest first. */
export function sortInbox(items: InboxItem[]): InboxItem[] {
  const rank = (i: InboxItem) => (i.urgente ? 0 : i.tipo === "aviso" ? 2 : 1);
  return [...items].sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    if (a.tipo === "aviso" && b.tipo === "aviso") return b.fecha.localeCompare(a.fecha);
    return a.fecha.localeCompare(b.fecha);
  });
}

export function summarize(items: InboxItem[]) {
  const porTipo: Record<InboxKind, number> = { pendiente: 0, aviso: 0, pago: 0 };
  for (const i of items) porTipo[i.tipo]++;
  return { items, total: items.length, porTipo };
}
