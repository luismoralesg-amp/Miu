import { z } from "zod";

/** Contracts of the academic port. Adapters parse what they return, so bad data stops at the edge. */

const hhmm = z.string().regex(/^\d{2}:\d{2}$/);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}/);

export const subsections = [
  "actividades",
  "notas",
  "documentos",
  "anuncios",
  "personas",
  "programa",
  "bibliografia",
  "foro",
  "blog",
  "examenes",
  "enlaces",
  "biblioteca",
  "recursos-ia",
  "actividad-reciente",
] as const;
export const Subsection = z.enum(subsections);
export type Subsection = z.infer<typeof Subsection>;

export const subsectionLabel: Record<Subsection, string> = {
  actividades: "Actividades",
  notas: "Notas",
  documentos: "Documentos",
  anuncios: "Anuncios",
  personas: "Personas",
  programa: "Programa",
  bibliografia: "Bibliografía",
  foro: "Foro",
  blog: "Blog",
  examenes: "Exámenes",
  enlaces: "Enlaces",
  biblioteca: "Biblioteca",
  "recursos-ia": "Recursos de IA",
  "actividad-reciente": "Actividad reciente",
};

export const PersonRef = z.object({ id: z.string(), nombre: z.string() });
export type PersonRef = z.infer<typeof PersonRef>;

export const CourseSlot = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

export const ClassTime = z.object({
  /** ISO weekdays: 1 = lunes … 7 = domingo. */
  dias: z.array(z.number().int().min(1).max(7)).min(1),
  ini: hhmm,
  fin: hhmm,
  salon: z.string(),
});
export type ClassTime = z.infer<typeof ClassTime>;

export const Course = z.object({
  id: z.string(),
  nombre: z.string(),
  corto: z.string(),
  slot: CourseSlot,
  facultadId: z.string(),
  facultad: z.string(),
  periodo: z.string(),
  creditos: z.number().int().positive(),
  sectionId: z.string(),
  seccion: z.string(),
  catedratico: PersonRef,
  auxiliares: z.array(PersonRef),
  horario: ClassTime,
  descripcion: z.string(),
  objetivos: z.array(z.string()),
  deshabilitadas: z.array(Subsection),
  estudiantes: z.number().int().nonnegative(),
});
export type Course = z.infer<typeof Course>;

export const ScheduleEntry = z.object({
  courseId: z.string(),
  nombre: z.string(),
  corto: z.string(),
  slot: CourseSlot,
  sectionId: z.string(),
  seccion: z.string(),
  dia: z.number().int().min(1).max(7),
  ini: hhmm,
  fin: hhmm,
  salon: z.string(),
});
export type ScheduleEntry = z.infer<typeof ScheduleEntry>;

export const Announcement = z.object({
  id: z.string(),
  courseId: z.string(),
  titulo: z.string(),
  cuerpo: z.string(),
  autor: PersonRef.extend({ rol: z.string() }),
  fecha: isoDate,
});
export type Announcement = z.infer<typeof Announcement>;

export const CourseDocument = z.object({
  id: z.string(),
  courseId: z.string(),
  titulo: z.string(),
  formato: z.string(),
  tamanoKb: z.number().nonnegative(),
  autor: PersonRef,
  fecha: isoDate,
});
export type CourseDocument = z.infer<typeof CourseDocument>;

/** A generic row for the simple subsections (people, bibliography, forum, links, library…). */
export const ContentItem = z.object({
  id: z.string(),
  titulo: z.string(),
  detalle: z.string(),
  fecha: isoDate.optional(),
  href: z.string().optional(),
  externo: z.boolean().optional(),
});
export type ContentItem = z.infer<typeof ContentItem>;

/** "Off" (the teacher disabled it) is not the same as "on, but empty". */
export const SubsectionContent = z.discriminatedUnion("estado", [
  z.object({ estado: z.literal("deshabilitada") }),
  z.object({ estado: z.literal("habilitada"), items: z.array(ContentItem) }),
]);
export type SubsectionContent = z.infer<typeof SubsectionContent>;

export const Term = z.object({
  id: z.string(),
  nombre: z.string(),
  inicio: isoDate,
  fin: isoDate,
  semanas: z.number().int().positive(),
  /** Exam week of the academic calendar, when Hoy switches to its exam layout. */
  semanaExamenes: z.object({ desde: isoDate, hasta: isoDate }).nullable(),
});
export type Term = z.infer<typeof Term>;

export const PastCourse = z.object({
  periodo: z.string(),
  codigo: z.string(),
  nombre: z.string(),
  seccion: z.string(),
  nota: z.number().min(0).max(100),
  uma: z.number().int().positive(),
  area: z.string(),
});
export type PastCourse = z.infer<typeof PastCourse>;

export const TeachingSection = z.object({
  sectionId: z.string(),
  seccion: z.string(),
  courseId: z.string(),
  nombre: z.string(),
  corto: z.string(),
  slot: CourseSlot,
  /** The actor's role in this section. */
  rol: z.enum(["catedratico", "auxiliar"]),
  catedratico: PersonRef,
  auxiliares: z.array(PersonRef),
  estudiantes: z.number().int().nonnegative(),
  horario: ClassTime,
});
export type TeachingSection = z.infer<typeof TeachingSection>;

export const RosterEntry = z.object({
  personId: z.string(),
  nombre: z.string(),
  /** Masked for teaching roles (FUNCIONES §3: roster con PII enmascarado). */
  carne: z.string(),
  correo: z.string(),
});
export type RosterEntry = z.infer<typeof RosterEntry>;

export const DirectoryPerson = z.object({
  id: z.string(),
  nombre: z.string(),
  rol: z.string(),
  courseId: z.string().optional(),
  slot: CourseSlot.optional(),
});
export type DirectoryPerson = z.infer<typeof DirectoryPerson>;
