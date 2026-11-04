import type { Condition, Permission, Scope } from "@/authz";

/** How each permission reads in Roles. A `Record`, so adding a permission without a label does not compile. */
export const PERMISSION_LABEL: Record<Permission, string> = {
  view_course: "Ver cursos y secciones",
  assign_assistant: "Asignar auxiliares",
  manage_activities: "Crear y editar actividades",
  grade: "Calificar",
  publish_grades: "Publicar notas",
  close_final_grade: "Cerrar la nota final",
  override_grade: "Cambiar una nota",
  view_submissions: "Ver entregas",
  submit: "Entregar",
  view_roster: "Ver la lista de estudiantes",
  post_announcement: "Publicar anuncios",
  read_announcement: "Leer anuncios",
  view_payments: "Ver pagos",
  pay: "Pagar",
  approve_payment: "Aprobar pagos",
  refund_payment: "Reembolsar",
  configure_enrollment: "Configurar la asignación",
  view_enrollment_policy: "Ver la política de asignación",
  set_enrollment_preferences: "Elegir preferencias de asignación",
  view_grade_stats: "Ver estadísticas de notas",
  create_appeal: "Pedir una apelación",
  respond_appeal: "Responder apelaciones",
  resolve_appeal: "Resolver apelaciones",
  manage_reminders: "Gestionar recordatorios",
  view_audit: "Ver la auditoría",
  configure_policy: "Configurar políticas",
  manage_roles: "Gestionar roles",
  view_academic_record: "Ver su registro académico",
};

export const SCOPE_LABEL: Record<Scope, string> = {
  global: "Toda la UFM",
  faculty: "Su facultad",
  course: "Sus cursos",
  section: "Sus secciones",
  own: "Lo propio",
};

export const CONDITION_LABEL: Record<Condition, string> = {
  escalated_appeal: "solo escaladas",
  before_close: "antes del cierre",
};
