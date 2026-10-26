import { z } from "zod";

export const PensumStatus = z.enum(["aprobado", "en_curso", "disponible", "bloqueado"]);
export type PensumStatus = z.infer<typeof PensumStatus>;

export const PensumCourse = z.object({
  codigo: z.string(),
  nombre: z.string(),
  semestre: z.number().int().min(1),
  area: z.string(),
  areaNombre: z.string(),
  uma: z.number().int().positive(),
  prerrequisitos: z.array(z.string()),
  estado: PensumStatus,
  nota: z.number().optional(),
  periodo: z.string().optional(),
  /** Current course id, to link to /cursos/[id] while it is in progress. */
  cursoActual: z.string().optional(),
});
export type PensumCourse = z.infer<typeof PensumCourse>;

export const Pensum = z.object({
  carrera: z.string(),
  semestreActual: z.number().int(),
  areas: z.array(z.object({ id: z.string(), nombre: z.string() })),
  cursos: z.array(PensumCourse),
  avance: z.object({
    aprobados: z.number().int(),
    enCurso: z.number().int(),
    total: z.number().int(),
    umaAprobadas: z.number().int(),
    umaTotales: z.number().int(),
  }),
});
export type Pensum = z.infer<typeof Pensum>;
