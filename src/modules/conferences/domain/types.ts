import { z } from "zod";

export const ConferenceStatus = z.enum([
  "disponible",
  "llena",
  "reservada",
  "en_espera",
  "por_evaluar",
  "evaluada",
  "expirada",
  "pasada",
]);
export type ConferenceStatus = z.infer<typeof ConferenceStatus>;

export const Conference = z.object({
  id: z.string(),
  titulo: z.string(),
  ponente: z.string(),
  fecha: z.string(),
  duracionMin: z.number().int(),
  lugar: z.string(),
  cupo: z.number().int(),
  inscritos: z.number().int(),
  descripcion: z.string(),
  estado: ConferenceStatus,
  /** Position on the waiting list, when waiting. */
  posicion: z.number().int().optional(),
  /** Until when the evaluation can be sent. */
  evaluarHasta: z.string().optional(),
});
export type Conference = z.infer<typeof Conference>;

export const EvaluationInput = z.object({
  calificacion: z.number().int().min(1).max(5),
  comentario: z.string().trim().max(600).default(""),
});
export type EvaluationInput = z.input<typeof EvaluationInput>;
