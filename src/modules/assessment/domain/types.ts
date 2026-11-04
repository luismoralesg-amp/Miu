import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}/);
const slot = z.number().int().min(1).max(6);

export const activityKinds = ["tarea", "examen", "quiz", "proyecto", "lectura"] as const;
export const ActivityKind = z.enum(activityKinds);
export type ActivityKind = z.infer<typeof ActivityKind>;

export const SubmissionMode = z.enum(["archivo", "texto", "repositorio", "en_linea", "presencial"]);
export type SubmissionMode = z.infer<typeof SubmissionMode>;

export const CourseTag = z.object({ id: z.string(), nombre: z.string(), corto: z.string(), slot });
export type CourseTag = z.infer<typeof CourseTag>;

export const Activity = z.object({
  id: z.string(),
  curso: CourseTag,
  tipo: ActivityKind,
  titulo: z.string(),
  peso: z.number().min(0).max(100),
  fecha: isoDate,
  fin: z.string().optional(),
  salon: z.string().optional(),
  temas: z.string().optional(),
  formato: z.string(),
  modo: SubmissionMode,
  atrasadaPermitida: z.boolean(),
  rubrica: z.array(z.object({ criterio: z.string(), peso: z.number() })),
  descripcion: z.string(),
});
export type Activity = z.infer<typeof Activity>;

export const Grade = z.object({
  nota: z.number().min(0).max(100),
  por: z.object({ id: z.string(), nombre: z.string(), rol: z.string() }),
  fecha: isoDate,
  nueva: z.boolean(),
  comentario: z.string().optional(),
});
export type Grade = z.infer<typeof Grade>;

export const Sha256 = z.string().regex(/^[0-9a-f]{64}$/, "Huella SHA-256 inválida");

export const Submission = z.object({
  /** Receipt number shown to the student. */
  recibo: z.string(),
  activityId: z.string(),
  fecha: isoDate,
  archivo: z.string(),
  tamanoBytes: z.number().int().nonnegative(),
  hash: Sha256,
  atrasada: z.boolean(),
});
export type Submission = z.infer<typeof Submission>;

/** Where an activity stands for the student. */
export const ActivityStatus = z.enum([
  "pendiente",
  "entregada",
  "calificada",
  "vencida",
  "programada",
]);
export type ActivityStatus = z.infer<typeof ActivityStatus>;

export const StudentActivity = Activity.extend({
  estado: ActivityStatus,
  entrega: Submission.optional(),
  calificacion: Grade.optional(),
});
export type StudentActivity = z.infer<typeof StudentActivity>;

export const SubmitInput = z.object({
  archivo: z.string().trim().min(1).max(200),
  tamanoBytes: z
    .number()
    .int()
    .positive()
    .max(50 * 1024 * 1024),
  hash: Sha256,
});
export type SubmitInput = z.infer<typeof SubmitInput>;

export const GradeRow = z.object({
  activityId: z.string(),
  titulo: z.string(),
  tipo: ActivityKind,
  peso: z.number(),
  fecha: isoDate,
  nota: z.number().nullable(),
  por: z.string().optional(),
  nueva: z.boolean(),
  comentario: z.string().optional(),
});
export type GradeRow = z.infer<typeof GradeRow>;

export const CourseGrades = z.object({
  curso: CourseTag,
  catedratico: z.string(),
  auxiliar: z.string().nullable(),
  /** Weight already graded, out of 100. */
  evaluado: z.number(),
  /** Points earned within that weight. */
  obtenido: z.number(),
  /** Grade so far over what was evaluated, 0–100 with one decimal. */
  actual: z.number(),
  nuevas: z.number().int(),
  filas: z.array(GradeRow),
});
export type CourseGrades = z.infer<typeof CourseGrades>;

export const Gradebook = z.object({
  periodo: z.string(),
  cursos: z.array(CourseGrades),
  promedio: z.number(),
  historial: z.array(z.object({ periodo: z.string(), promedio: z.number() })),
  metas: z.array(z.number()),
  umbral: z.number(),
});
export type Gradebook = z.infer<typeof Gradebook>;

export const BatchEntry = z.object({
  studentId: z.string(),
  nombre: z.string(),
  carne: z.string(),
  fecha: isoDate,
  archivo: z.string(),
  atrasada: z.boolean(),
  nota: z.number().nullable(),
  justificacion: z.string().optional(),
  estado: z.enum(["sin_nota", "guardada", "publicada"]),
});
export type BatchEntry = z.infer<typeof BatchEntry>;

export const Batch = z.object({
  sectionId: z.string(),
  seccion: z.string(),
  curso: CourseTag,
  activity: z.object({ id: z.string(), titulo: z.string(), cierre: isoDate }),
  umbral: z.number(),
  entradas: z.array(BatchEntry),
});
export type Batch = z.infer<typeof Batch>;

export const GradeInput = z.object({
  sectionId: z.string(),
  activityId: z.string(),
  studentId: z.string(),
  nota: z.number().int().min(0).max(100),
  justificacion: z.string().trim().max(500).optional(),
});
export type GradeInput = z.infer<typeof GradeInput>;

export const QueueItem = z.object({
  sectionId: z.string(),
  seccion: z.string(),
  curso: CourseTag,
  activityId: z.string(),
  titulo: z.string(),
  cierre: isoDate,
  entregadas: z.number().int(),
  calificadas: z.number().int(),
  publicadas: z.number().int(),
});
export type QueueItem = z.infer<typeof QueueItem>;

/** Where an activity stands for the people who teach the section. */
export const TeachingActivityStatus = z.enum([
  "programada",
  "por_calificar",
  "sin_publicar",
  "publicada",
]);
export type TeachingActivityStatus = z.infer<typeof TeachingActivityStatus>;

export const TeachingActivity = z.object({
  id: z.string(),
  titulo: z.string(),
  tipo: ActivityKind,
  peso: z.number(),
  fecha: isoDate,
  estado: TeachingActivityStatus,
  /** Grades saved for the section (published or not), out of `estudiantes`. */
  calificadas: z.number().int(),
  publicadas: z.number().int(),
  /** Mean of the saved grades, one decimal; null before any grade. */
  promedio: z.number().nullable(),
  /** The batch can be opened from Por calificar. */
  enLote: z.boolean(),
});
export type TeachingActivity = z.infer<typeof TeachingActivity>;

export const GradebookStudent = z.object({
  studentId: z.string(),
  nombre: z.string(),
  /** Masked for teaching roles. */
  carne: z.string(),
  /** Grade per activity id; null while there is none. */
  notas: z.record(z.string(), z.number().nullable()),
  evaluado: z.number(),
  actual: z.number(),
});
export type GradebookStudent = z.infer<typeof GradebookStudent>;

/** A section's gradebook: every student against every activity, as the teaching team sees it. */
export const SectionGradebook = z.object({
  sectionId: z.string(),
  seccion: z.string(),
  curso: CourseTag,
  umbral: z.number(),
  cerrada: z.boolean(),
  actividades: z.array(TeachingActivity),
  estudiantes: z.array(GradebookStudent),
  /** Mean of the students' current grades, one decimal. */
  promedio: z.number(),
  bajoUmbral: z.number().int(),
});
export type SectionGradebook = z.infer<typeof SectionGradebook>;

export const Appeal = z.object({
  id: z.string(),
  activityId: z.string(),
  actividad: z.string(),
  curso: CourseTag,
  sectionId: z.string(),
  seccion: z.string(),
  estudiante: z.object({ id: z.string(), nombre: z.string() }),
  motivo: z.string(),
  fecha: isoDate,
  estado: z.enum(["nueva", "respondida", "escalada", "resuelta"]),
  respuesta: z.string().optional(),
  nota: z.number().nullable(),
});
export type Appeal = z.infer<typeof Appeal>;

export const AppealInput = z.object({
  activityId: z.string(),
  motivo: z.string().trim().min(20, "Explica el motivo en al menos 20 caracteres").max(1000),
});
