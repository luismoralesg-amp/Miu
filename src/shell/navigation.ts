import type { Role } from "@/modules/identity/domain/types";

/**
 * Every section of the app, in one place. The bar, the "Más" panel, ⌘K and the placeholder pages all
 * read from here, so no MiU function can drop out of the navigation.
 */
export type Section = {
  path: string;
  titulo: string;
  icono: IconName;
  /** Plan stage that builds the screen (docs/PLAN_FASE1.md §8). */
  etapa: string;
  descripcion: string;
  externo?: boolean;
};

export type IconName =
  | "sun"
  | "book-open"
  | "calendar"
  | "chart"
  | "wallet"
  | "map"
  | "history"
  | "list-plus"
  | "mic"
  | "file-badge"
  | "messages"
  | "life-buoy"
  | "user"
  | "shield"
  | "devices"
  | "folder"
  | "file-text"
  | "graduation"
  | "clipboard"
  | "car"
  | "printer"
  | "languages"
  | "contact"
  | "building"
  | "calendar-days"
  | "image"
  | "sparkles"
  | "mail"
  | "drive"
  | "users"
  | "list-checks"
  | "send"
  | "message-square"
  | "scale"
  | "landmark"
  | "user-cog"
  | "scroll";

const S = (
  path: string,
  titulo: string,
  icono: IconName,
  etapa: string,
  descripcion: string,
  externo = false,
): Section =>
  externo
    ? { path, titulo, icono, etapa, descripcion, externo }
    : { path, titulo, icono, etapa, descripcion };

export const SECTIONS = {
  hoy: S("/", "Hoy", "sun", "E4", "Lo que tienes que hacer ahora."),
  cursos: S(
    "/cursos",
    "Cursos",
    "book-open",
    "E5",
    "Tus cursos del período, cada uno con su línea de tiempo.",
  ),
  semana: S(
    "/semana",
    "Semana",
    "calendar",
    "E6",
    "Clases, entregas y exámenes de lunes a domingo, con la carga de cada día.",
  ),
  notas: S("/notas", "Notas", "chart", "E6", "Cómo vas en cada curso y qué te falta para aprobar."),
  pagos: S("/pagos", "Pagos", "wallet", "E7", "Saldo, solvencia, formas de pago y recibos."),
  pensum: S(
    "/pensum",
    "Pensum y mapa de cursos",
    "map",
    "E6",
    "Tu avance por semestre, con prerrequisitos y requisitos.",
  ),
  historial: S(
    "/historial",
    "Historial de cursos",
    "history",
    "E6",
    "Cursos anteriores con su nota final.",
  ),
  asignacion: S(
    "/asignacion",
    "Asignar y botar cursos",
    "list-plus",
    "E8",
    "Preferencias de sección y resolución por lote, sin ventanas emergentes.",
  ),
  conferencias: S(
    "/conferencias",
    "Conferencias",
    "mic",
    "E8",
    "Reservar, cancelar y evaluar conferencias.",
  ),
  documentos: S(
    "/documentos",
    "Documentos académicos",
    "file-badge",
    "E8",
    "Tus documentos oficiales.",
  ),
  comunicacion: S(
    "/comunicacion",
    "Mensajes",
    "messages",
    "E9",
    "Conversaciones con catedráticos y auxiliares.",
  ),
  soporte: S(
    "/soporte",
    "Soporte y ayuda",
    "life-buoy",
    "E9",
    "Preguntas frecuentes, manuales y chat por departamento.",
  ),
  informacion: S(
    "/cuenta/informacion",
    "Información personal",
    "user",
    "E9",
    "Tus datos, con el CUI y la fecha de nacimiento ocultos.",
  ),
  privacidad: S(
    "/cuenta/privacidad",
    "Privacidad",
    "shield",
    "E9",
    "Qué ven los demás de ti; todo desactivado por defecto.",
  ),
  dispositivos: S(
    "/cuenta/dispositivos",
    "Accesos y dispositivos",
    "devices",
    "E2",
    "Dónde tienes sesión abierta, con cierre remoto.",
  ),
  archivos: S(
    "/cuenta/archivos",
    "Mis archivos",
    "folder",
    "E9",
    "Archivos de Drive con permiso explícito.",
  ),
  solicitudes: S(
    "/servicios/documentos",
    "Solicitud de documentos",
    "file-text",
    "E9",
    "Constancias, certificaciones y cartas.",
  ),
  graduaciones: S(
    "/servicios/graduaciones",
    "Graduaciones",
    "graduation",
    "E9",
    "Requisitos y trámites de graduación.",
  ),
  suficiencia: S(
    "/servicios/suficiencia",
    "Examen por suficiencia",
    "clipboard",
    "E9",
    "Solicitud y fechas.",
  ),
  parqueo: S("/servicios/parqueo", "Parqueo", "car", "E9", "Activación del parqueo."),
  impresiones: S(
    "/servicios/impresiones",
    "Impresiones de laboratorio",
    "printer",
    "E9",
    "Saldo y envío de impresiones.",
  ),
  duolingo: S("/servicios/duolingo", "Duolingo", "languages", "E9", "Requisito de inglés."),
  directorio: S(
    "/recursos/directorio",
    "Directorio de personas",
    "contact",
    "E9",
    "Catedráticos y estudiantes que aceptaron aparecer.",
  ),
  oficinas: S(
    "/recursos/oficinas",
    "Directorio de oficinas",
    "building",
    "E9",
    "Teléfonos, ubicación y correo.",
  ),
  eventos: S("/recursos/eventos", "Eventos", "calendar-days", "E9", "Eventos del campus."),
  marca: S("/recursos/marca", "Logotipos y fondos", "image", "E9", "Archivos oficiales de la UFM."),
  chatgpt: S(
    "/recursos/chatgpt-edu",
    "ChatGPT Edu",
    "sparkles",
    "E9",
    "Estado y gestión de tu cuenta.",
  ),
  ufmail: S("https://mail.google.com", "UFMail", "mail", "", "Correo de Google Workspace.", true),
  calendar: S(
    "https://calendar.google.com",
    "Calendar",
    "calendar",
    "",
    "Calendario de Google Workspace.",
    true,
  ),
  drive: S("https://drive.google.com", "Drive", "drive", "", "Archivos de Google Workspace.", true),
  // Teaching roles
  catedra: S(
    "/catedra",
    "Mis secciones",
    "users",
    "E10",
    "Secciones, auxiliares asignados y estado de cada actividad.",
  ),
  porCalificar: S(
    "/catedra/por-calificar",
    "Por calificar",
    "list-checks",
    "E10",
    "Entregas pendientes, con calificación en lote.",
  ),
  libro: S(
    "/catedra/libro",
    "Libro de notas",
    "scroll",
    "E10",
    "Notas por estudiante y por componente.",
  ),
  publicar: S(
    "/catedra/publicar",
    "Publicar notas",
    "send",
    "E10",
    "Revisión y publicación con resumen.",
  ),
  apelaciones: S(
    "/catedra/apelaciones",
    "Apelaciones",
    "message-square",
    "E10",
    "Solicitudes de revisión de los estudiantes.",
  ),
  // Administrative role
  politicas: S(
    "/admin/politicas",
    "Políticas",
    "scale",
    "E11",
    "Umbrales, ventanas de asignación y reglas configurables.",
  ),
  conciliacion: S(
    "/admin/pagos",
    "Pagos y conciliación",
    "landmark",
    "E11",
    "Cola de revisión de comprobantes y caja.",
  ),
  roles: S("/admin/roles", "Roles", "user-cog", "E11", "Quién puede hacer qué, y en qué ámbito."),
  auditoria: S("/admin/auditoria", "Auditoría", "scroll", "E11", "Registro de cambios sensibles."),
} as const satisfies Record<string, Section>;

export type SectionKey = keyof typeof SECTIONS;

type Nav = { barra: SectionKey[]; movil: SectionKey[]; mas: Array<[string, SectionKey[]]> };

const CUENTA: [string, SectionKey[]] = [
  "Mi cuenta",
  ["informacion", "privacidad", "dispositivos", "archivos"],
];
const AYUDA: [string, SectionKey[]] = ["Comunicación y ayuda", ["comunicacion", "soporte"]];
const RECURSOS: [string, SectionKey[]] = [
  "Recursos",
  ["directorio", "oficinas", "eventos", "marca", "chatgpt"],
];
const GOOGLE: [string, SectionKey[]] = ["Google Workspace", ["ufmail", "calendar", "drive"]];

export const NAV: Record<Role, Nav> = {
  estudiante: {
    barra: ["hoy", "cursos", "semana", "notas", "pagos"],
    movil: ["hoy", "cursos", "notas", "pagos"],
    mas: [
      ["Académico", ["pensum", "historial", "semana", "asignacion", "conferencias", "documentos"]],
      AYUDA,
      CUENTA,
      [
        "Servicios",
        ["solicitudes", "graduaciones", "suficiencia", "parqueo", "impresiones", "duolingo"],
      ],
      RECURSOS,
      GOOGLE,
    ],
  },
  maestro: {
    barra: ["hoy", "catedra", "porCalificar", "libro", "apelaciones"],
    movil: ["hoy", "catedra", "porCalificar", "libro"],
    mas: [["Cátedra", ["publicar", "apelaciones"]], AYUDA, CUENTA, RECURSOS, GOOGLE],
  },
  auxiliar: {
    barra: ["hoy", "catedra", "porCalificar", "publicar", "apelaciones"],
    movil: ["hoy", "catedra", "porCalificar", "publicar"],
    mas: [["Cátedra", ["libro", "apelaciones"]], AYUDA, CUENTA, RECURSOS, GOOGLE],
  },
  administrativo: {
    barra: ["hoy", "politicas", "conciliacion", "roles", "auditoria"],
    movil: ["hoy", "politicas", "conciliacion", "roles"],
    mas: [["Administración", ["auditoria"]], AYUDA, CUENTA, RECURSOS, GOOGLE],
  },
};

/** Labels in the bar are shorter than section titles. */
export const BAR_LABEL: Partial<Record<SectionKey, string>> = {
  catedra: "Mis secciones",
  porCalificar: "Por calificar",
  libro: "Libro de notas",
  conciliacion: "Pagos",
};

export function sectionByPath(path: string): Section | undefined {
  return Object.values(SECTIONS).find((s) => !s.externo && s.path === path);
}

export function isActive(sectionPath: string, pathname: string) {
  return sectionPath === "/"
    ? pathname === "/"
    : pathname === sectionPath || pathname.startsWith(`${sectionPath}/`);
}
