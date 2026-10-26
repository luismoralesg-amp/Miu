import { z } from "zod";

export const AuditAction = z.enum([
  "calificar",
  "publicar",
  "cerrar_nota_final",
  "sobrescribir",
  "apelacion",
  "aprobar_pago",
  "rechazar_pago",
  "reembolso",
  "politica",
  "rol",
  "acceso",
]);
export type AuditAction = z.infer<typeof AuditAction>;

export const AuditInput = z.object({
  accion: AuditAction,
  recurso: z.string().min(1),
  /** Section the record belongs to, so teachers see their own course's trail. */
  sectionId: z.string().optional(),
  detalle: z.string().min(1).max(500),
  antes: z.string().optional(),
  despues: z.string().optional(),
  motivo: z.string().max(500).optional(),
});
export type AuditInput = z.infer<typeof AuditInput>;

export const AuditEntry = AuditInput.extend({
  id: z.string(),
  fecha: z.string(),
  actorId: z.string(),
  actorNombre: z.string(),
  rol: z.string(),
});
export type AuditEntry = z.infer<typeof AuditEntry>;
