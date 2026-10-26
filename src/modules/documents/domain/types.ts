import { z } from "zod";

export const documentKinds = [
  "constancia_inscripcion",
  "certificacion_notas",
  "constancia_solvencia",
  "carta_recomendacion",
] as const;
export const DocumentKind = z.enum(documentKinds);
export type DocumentKind = z.infer<typeof DocumentKind>;

export const kindLabel: Record<DocumentKind, string> = {
  constancia_inscripcion: "Constancia de inscripción",
  certificacion_notas: "Certificación de notas",
  constancia_solvencia: "Constancia de solvencia",
  carta_recomendacion: "Carta de recomendación",
};

export const AcademicDocument = z.object({
  id: z.string(),
  tipo: DocumentKind,
  titulo: z.string(),
  fecha: z.string(),
  estado: z.enum(["listo", "en_proceso"]),
  /** Verification code printed on the document [S]. */
  verificacion: z.string(),
});
export type AcademicDocument = z.infer<typeof AcademicDocument>;
