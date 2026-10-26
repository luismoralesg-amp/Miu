import { z } from "zod";

export const InboxKind = z.enum(["pendiente", "aviso", "pago"]);
export type InboxKind = z.infer<typeof InboxKind>;

export const InboxItem = z.object({
  id: z.string(),
  tipo: InboxKind,
  titulo: z.string(),
  detalle: z.string(),
  /** Due date for pending work and payments; publication date for notices. */
  fecha: z.string(),
  href: z.string().startsWith("/"),
  slot: z.number().int().min(1).max(6).optional(),
  /** Due within 24 h, or overdue. */
  urgente: z.boolean(),
  icono: z.enum([
    "entrega",
    "examen",
    "nota",
    "documento",
    "anuncio",
    "pago",
    "calificar",
    "apelacion",
  ]),
});
export type InboxItem = z.infer<typeof InboxItem>;

export const Inbox = z.object({
  items: z.array(InboxItem),
  /** Same query as the list: the badge can never disagree with it. */
  total: z.number().int().nonnegative(),
  porTipo: z.record(InboxKind, z.number().int().nonnegative()),
});
export type Inbox = z.infer<typeof Inbox>;
