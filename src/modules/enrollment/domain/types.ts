import { z } from "zod";

const hhmm = z.string().regex(/^\d{2}:\d{2}$/);

export const EnrollmentWindow = z.object({
  periodo: z.string(),
  abre: z.string(),
  cierra: z.string(),
  /** Batch resolution: everyone's preferences are resolved at once, no first-come race. */
  resolucion: z.string(),
  maxUma: z.number().int(),
  estado: z.enum(["proxima", "abierta", "cerrada", "resuelta"]),
});
export type EnrollmentWindow = z.infer<typeof EnrollmentWindow>;

export const OfferSection = z.object({
  id: z.string(),
  seccion: z.string(),
  dias: z.array(z.number().int().min(1).max(7)),
  ini: hhmm,
  fin: hhmm,
  catedratico: z.string(),
  cupo: z.number().int(),
});
export type OfferSection = z.infer<typeof OfferSection>;

export const OfferCourse = z.object({
  codigo: z.string(),
  nombre: z.string(),
  uma: z.number().int(),
  area: z.string(),
  secciones: z.array(OfferSection),
});
export type OfferCourse = z.infer<typeof OfferCourse>;

export const Preference = z.object({
  codigo: z.string(),
  /** Section ids in order of preference: first choice, then fallback. */
  secciones: z.array(z.string()).min(1).max(2),
});
export type Preference = z.infer<typeof Preference>;

export const SavedPreferences = z.object({
  preferencias: z.array(Preference),
  guardadas: z.string().nullable(),
});
export type SavedPreferences = z.infer<typeof SavedPreferences>;

export const StepUp = z.object({ expira: z.string(), codigoPrueba: z.string().optional() });
export type StepUp = z.infer<typeof StepUp>;
