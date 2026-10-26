import type { Role } from "@/modules/identity";

/**
 * Role-based access with scope, transcribed from the matrix in docs/FUNCIONES_NUEVAS_Y_PAGOS.md §3.
 * A row says a role holds a permission within a scope; anything without a row is denied.
 */
export const permissions = [
  "view_course",
  "assign_assistant",
  "manage_activities",
  "grade",
  "publish_grades",
  "close_final_grade",
  "override_grade",
  "view_submissions",
  "submit",
  "view_roster",
  "post_announcement",
  "read_announcement",
  "view_payments",
  "pay",
  "approve_payment",
  "refund_payment",
  "configure_enrollment",
  "view_enrollment_policy",
  "set_enrollment_preferences",
  "view_grade_stats",
  "create_appeal",
  "respond_appeal",
  "resolve_appeal",
  "manage_reminders",
  "view_audit",
  "configure_policy",
  "manage_roles",
  // Not a row of §3: the student's own record (Notas, Horario, Pensum, Historial, Documentos).
  "view_academic_record",
] as const;
export type Permission = (typeof permissions)[number];

/** `own` = the subject's own records; `section` and `course` = the ones assigned to the subject. */
export const scopes = ["global", "faculty", "course", "section", "own"] as const;
export type Scope = (typeof scopes)[number];

/** Extra condition a rule needs, beyond scope. */
export type Condition =
  /** Administrativo overrides a grade only through an escalated appeal (audited). */
  | "escalated_appeal"
  /** Auxiliar changes only grades they gave, and only before the final close. */
  | "before_close";

export type Rule = { role: Role; permission: Permission; scope: Scope; when?: Condition };

const R = (role: Role, permission: Permission, scope: Scope, when?: Condition): Rule =>
  when ? { role, permission, scope, when } : { role, permission, scope };

export const MATRIX: Rule[] = [
  // Ver cursos y secciones
  R("administrativo", "view_course", "global"),
  R("maestro", "view_course", "course"),
  R("auxiliar", "view_course", "section"),
  R("estudiante", "view_course", "own"),
  // Asignar auxiliares a secciones
  R("administrativo", "assign_assistant", "global"),
  R("maestro", "assign_assistant", "course"),
  // Crear y editar tareas, exámenes y rúbricas (el Administrativo solo configura políticas)
  R("maestro", "manage_activities", "course"),
  R("auxiliar", "manage_activities", "section"),
  // Calificar y publicar notas de actividades y parciales
  R("maestro", "grade", "course"),
  R("auxiliar", "grade", "section"),
  R("maestro", "publish_grades", "course"),
  R("auxiliar", "publish_grades", "section"),
  // Cerrar la nota final: solo el Maestro por defecto [S]; el Auxiliar, si se le otorga
  R("maestro", "close_final_grade", "course"),
  // Revisar o sobrescribir una nota
  R("administrativo", "override_grade", "global", "escalated_appeal"),
  R("maestro", "override_grade", "course"),
  R("auxiliar", "override_grade", "own", "before_close"),
  // Ver entregas y entregar
  R("administrativo", "view_submissions", "global"),
  R("maestro", "view_submissions", "course"),
  R("auxiliar", "view_submissions", "section"),
  R("estudiante", "view_submissions", "own"),
  R("estudiante", "submit", "own"),
  // Roster con PII (enmascarado para Maestro y Auxiliar)
  R("administrativo", "view_roster", "global"),
  R("maestro", "view_roster", "course"),
  R("auxiliar", "view_roster", "section"),
  // Anuncios
  R("administrativo", "post_announcement", "global"),
  R("maestro", "post_announcement", "course"),
  R("auxiliar", "post_announcement", "section"),
  R("estudiante", "read_announcement", "own"),
  // Pagos (aprobar y reembolsar requieren dos personas: lo hace cumplir el caso de uso)
  R("administrativo", "view_payments", "global"),
  R("estudiante", "view_payments", "own"),
  R("estudiante", "pay", "own"),
  R("administrativo", "approve_payment", "global"),
  R("administrativo", "refund_payment", "global"),
  // Políticas de asignación y cupos
  R("administrativo", "configure_enrollment", "global"),
  R("maestro", "view_enrollment_policy", "course"),
  R("estudiante", "set_enrollment_preferences", "own"),
  // Estadísticas de calificación
  R("administrativo", "view_grade_stats", "global"),
  R("maestro", "view_grade_stats", "course"),
  R("auxiliar", "view_grade_stats", "section"),
  // Apelaciones
  R("estudiante", "create_appeal", "own"),
  R("auxiliar", "respond_appeal", "section"),
  R("maestro", "respond_appeal", "course"),
  R("maestro", "resolve_appeal", "course"),
  R("administrativo", "resolve_appeal", "global", "escalated_appeal"),
  // Recordatorios
  R("administrativo", "manage_reminders", "global"),
  R("maestro", "manage_reminders", "course"),
  R("auxiliar", "manage_reminders", "section"),
  R("estudiante", "manage_reminders", "own"),
  // Auditoría
  R("administrativo", "view_audit", "global"),
  R("maestro", "view_audit", "course"),
  R("auxiliar", "view_audit", "own"),
  R("estudiante", "view_audit", "own"),
  // Políticas y roles
  R("administrativo", "configure_policy", "global"),
  R("administrativo", "manage_roles", "global"),
  // Registro académico propio (pantallas del Estudiante en §3)
  R("estudiante", "view_academic_record", "own"),
];
