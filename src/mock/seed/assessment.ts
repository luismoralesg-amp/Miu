import { SECTIONS } from "./courses";
import { at } from "./time";

export type ActivityKind = "tarea" | "examen" | "quiz" | "proyecto" | "lectura";

/** How the work is handed in. Exams are in person; quizzes run online for a fixed time. */
export type SubmissionMode = "archivo" | "texto" | "repositorio" | "en_linea" | "presencial";

export type SeedActivity = {
  id: string;
  courseId: string;
  tipo: ActivityKind;
  titulo: string;
  /** Percentage of the final grade. The weights of a course add up to 100. */
  peso: number;
  /** Deadline, or start time for exams. */
  fecha: string;
  /** Exams only: end time and room. */
  fin?: string;
  salon?: string;
  temas?: string;
  formato: string;
  modo: SubmissionMode;
  atrasadaPermitida: boolean;
  rubrica: Array<[criterio: string, peso: number]>;
  descripcion: string;
};

const SEGUN_ENUNCIADO: Array<[string, number]> = [["Según el enunciado", 100]];

const A = (
  id: string,
  courseId: string,
  tipo: ActivityKind,
  titulo: string,
  peso: number,
  fecha: string,
  extra: Partial<SeedActivity> = {},
): SeedActivity => ({
  id,
  courseId,
  tipo,
  titulo,
  peso,
  fecha,
  formato: tipo === "examen" ? "Presencial" : "Archivo PDF",
  modo: tipo === "examen" ? "presencial" : "archivo",
  atrasadaPermitida: false,
  rubrica: SEGUN_ENUNCIADO,
  descripcion: "",
  ...extra,
});

const MD = "matematica-discreta";
const PP = "paradigmas-de-programacion";
const EL = "etica-de-la-libertad";
const BD = "bases-de-datos-1";

export const ACTIVITIES: SeedActivity[] = [
  // Matemática Discreta: 60% evaluated
  A("md-quizzes-1-2", MD, "quiz", "Quizzes 1 y 2", 10, at(-21, "23:59"), {
    formato: "En línea, 20 min",
    modo: "en_linea",
  }),
  A("md-tareas-1-3", MD, "tarea", "Tareas 1 a 3", 15, at(-14, "23:59")),
  A("md-parcial-1", MD, "examen", "Parcial 1", 20, at(-30, "07:00"), {
    fin: "08:20",
    salon: "D-307",
    temas: "lógica, conjuntos e inducción",
  }),
  A("md-avance-proyecto", MD, "proyecto", "Avance del proyecto", 10, at(-10, "23:59"), {
    formato: "Repositorio",
    modo: "repositorio",
  }),
  A("md-quiz-3", MD, "quiz", "Quiz 3: lógica", 5, at(-3, "23:59"), {
    formato: "En línea, 20 min",
    modo: "en_linea",
  }),
  A("md-parcial-2", MD, "examen", "Parcial 2", 20, at(1, "07:00"), {
    fin: "08:20",
    salon: "D-307",
    temas: "grafos, árboles y recurrencias",
  }),
  A("md-quiz-4", MD, "quiz", "Quiz 4: grafos", 5, at(3, "23:59"), {
    formato: "En línea, 20 min",
    modo: "en_linea",
    descripcion: "Diez preguntas sobre recorridos, árboles generadores y coloración. Un intento.",
  }),
  A("md-proyecto-final", MD, "proyecto", "Proyecto final", 15, at(40, "23:59"), {
    formato: "Repositorio",
    modo: "repositorio",
  }),

  // Paradigmas de Programación: 55% evaluated
  A("pp-actividades-1-4", PP, "tarea", "Actividades 1 a 4", 20, at(-28, "23:59")),
  A("pp-parcial-1", PP, "examen", "Parcial 1", 25, at(-31, "09:00"), {
    fin: "10:20",
    salon: "D-210",
    temas: "funciones puras y recursión",
  }),
  A("pp-actividad-5", PP, "tarea", "Actividad 5", 10, at(-9, "23:59"), {
    formato: "Archivo .zip",
  }),
  A("pp-actividad-6", PP, "tarea", "Actividad 6: closures", 5, at(-2, "23:59"), {
    formato: "Archivo .zip",
    atrasadaPermitida: true,
    rubrica: [
      ["Correctitud", 60],
      ["Pruebas", 25],
      ["Estilo y claridad", 15],
    ],
  }),
  A("pp-ejercicio-llaves", PP, "tarea", "Ejercicio de llaves", 5, at(1, "23:59"), {
    formato: "Archivo .zip",
    rubrica: [
      ["Correctitud", 50],
      ["Pruebas", 30],
      ["Estilo y claridad", 20],
    ],
    descripcion:
      "Escribe una función que diga si las llaves, corchetes y paréntesis de un texto están balanceados, con sus pruebas. Entrega un .zip con el código y un README de una línea.",
  }),
  A("pp-parcial-2", PP, "examen", "Parcial 2", 25, at(4, "09:00"), {
    fin: "10:20",
    salon: "D-210",
    temas: "closures, recursión y tipos",
  }),
  A("pp-proyecto-parser", PP, "proyecto", "Proyecto: parser JSON", 10, at(12, "23:59"), {
    formato: "Repositorio",
    modo: "repositorio",
    rubrica: [
      ["Casos de la especificación", 50],
      ["Mensajes de error", 20],
      ["Pruebas", 20],
      ["README", 10],
    ],
  }),

  // Ética de la Libertad: 50% evaluated
  A("el-comentarios-1-4", EL, "lectura", "Comentarios de lectura 1 a 4", 20, at(-10, "08:00"), {
    formato: "Comentario de 300 palabras",
    modo: "texto",
  }),
  A("el-ensayo-1", EL, "tarea", "Ensayo 1", 20, at(-22, "23:59")),
  A("el-control-lectura", EL, "quiz", "Control de lectura", 10, at(-15, "14:00"), {
    formato: "En clase",
    modo: "presencial",
  }),
  A("el-lectura-hayek-3", EL, "lectura", "Lectura: Hayek, capítulo 3", 5, at(4, "08:00"), {
    formato: "Comentario de 300 palabras",
    modo: "texto",
    rubrica: [
      ["Comprensión del texto", 50],
      ["Argumento propio", 30],
      ["Redacción", 20],
    ],
    descripcion: "Resume la idea central del capítulo y discute una objeción, en 300 palabras.",
  }),
  A("el-examen-parcial", EL, "examen", "Examen parcial", 20, at(7, "14:00"), {
    fin: "15:20",
    salon: "Auditorio Juan Bautista",
    temas: "Hayek y Mises, capítulos 1 a 4",
  }),
  A("el-ensayo-orden", EL, "tarea", "Ensayo: orden espontáneo", 25, at(18, "23:59"), {
    formato: "PDF, 1 500 palabras",
  }),

  // Bases de Datos I: 45% evaluated
  A("bd-tareas-1-2", BD, "tarea", "Tareas 1 y 2", 10, at(-35, "23:59")),
  A("bd-parcial-1", BD, "examen", "Parcial 1", 25, at(-29, "10:30"), {
    fin: "11:50",
    salon: "D-105",
    temas: "modelo entidad-relación",
  }),
  A("bd-laboratorios-1-3", BD, "tarea", "Laboratorios 1 a 3", 10, at(-7, "23:59"), {
    formato: "Script .sql",
  }),
  A("bd-tarea-3", BD, "tarea", "Tarea 3: modelo entidad-relación", 5, at(-1, "23:59")),
  A("bd-tarea-4", BD, "tarea", "Tarea 4: normalización", 5, at(6, "23:59"), {
    rubrica: [
      ["Dependencias funcionales", 40],
      ["Formas normales", 40],
      ["Presentación", 20],
    ],
    descripcion: "Normaliza el esquema de la biblioteca hasta 3FN y justifica cada paso.",
  }),
  A("bd-parcial-2", BD, "examen", "Parcial 2", 25, at(5, "10:30"), {
    fin: "11:50",
    salon: "D-105",
    temas: "normalización y SQL",
  }),
  A("bd-proyecto-final", BD, "proyecto", "Proyecto final", 20, at(43, "23:59"), {
    formato: "Repositorio",
    modo: "repositorio",
  }),
];

export type SeedGrade = {
  activityId: string;
  nota: number;
  porId: string;
  fecha: string;
  nueva?: boolean;
  comentario?: string;
};

/** The demo student's published grades. Course averages: 77.7, 91.0, 87.0 and 84.0. */
export const STUDENT_GRADES: SeedGrade[] = [
  { activityId: "md-quizzes-1-2", nota: 78, porId: "p-sofia", fecha: at(-21, "19:00") },
  { activityId: "md-tareas-1-3", nota: 80, porId: "p-sofia", fecha: at(-14, "18:00") },
  { activityId: "md-parcial-1", nota: 72, porId: "p-jorge", fecha: at(-28, "16:00") },
  { activityId: "md-avance-proyecto", nota: 79, porId: "p-jorge", fecha: at(-8, "16:00") },
  {
    activityId: "md-quiz-3",
    nota: 90,
    porId: "p-sofia",
    fecha: at(-2, "19:00"),
    nueva: true,
    comentario: "Muy bien la tabla de verdad; revisa la contrapositiva del ejercicio 4.",
  },
  { activityId: "pp-actividades-1-4", nota: 93, porId: "p-carlos", fecha: at(-26, "20:00") },
  { activityId: "pp-parcial-1", nota: 89, porId: "p-andres", fecha: at(-27, "15:00") },
  {
    activityId: "pp-actividad-5",
    nota: 92,
    porId: "p-carlos",
    fecha: at(0, "05:40"),
    nueva: true,
    comentario: "Buen uso de map y reduce. Faltó una prueba para la lista vacía.",
  },
  { activityId: "el-comentarios-1-4", nota: 85, porId: "p-lucia", fecha: at(-9, "13:00") },
  { activityId: "el-ensayo-1", nota: 90, porId: "p-lucia", fecha: at(-18, "13:00") },
  { activityId: "el-control-lectura", nota: 85, porId: "p-lucia", fecha: at(-14, "18:00") },
  { activityId: "bd-tareas-1-2", nota: 82, porId: "p-diego", fecha: at(-33, "18:00") },
  { activityId: "bd-parcial-1", nota: 84, porId: "p-marta", fecha: at(-26, "12:00") },
  { activityId: "bd-laboratorios-1-3", nota: 86, porId: "p-diego", fecha: at(-6, "18:00") },
];

export type SeedSubmission = {
  activityId: string;
  studentId: string;
  fecha: string;
  archivo: string;
  /** SHA-256 of the file, shown on the receipt. */
  hash: string;
};

/** The demo student's submissions still waiting for a grade. */
export const STUDENT_SUBMISSIONS: SeedSubmission[] = [
  {
    activityId: "pp-actividad-6",
    studentId: "p-ana",
    fecha: at(-2, "21:40"),
    archivo: "closures.zip",
    hash: "9f2c4e1ab0d37c55e2f8a61c0b4d93e7a1c6f25d84b0e3a97c12d5f60e8b4a31",
  },
  {
    activityId: "bd-tarea-3",
    studentId: "p-ana",
    fecha: at(-1, "16:20"),
    archivo: "modelo-er.pdf",
    hash: "3b7d0e5c9a14f2e86c1d7b30a5e9f4c2d8a16b7e03f5c9d24e1a8b6c07d3f95e",
  },
];

/** Semester averages before this one (the trend on Notas). */
export const GRADE_HISTORY: Array<[term: string, promedio: number]> = [
  ["2024-2", 80.6],
  ["2025-1", 82.1],
  ["2025-2", 83.0],
  ["2026-1", 83.8],
];

/**
 * Batch grading: Actividad 6 of Paradigmas, section A. Every student handed in; four are already
 * graded by the assistant, one of them under the threshold with its justification.
 */
const PP_A = SECTIONS.find((s) => s.id === "pp-a")!;
const GRADED: Record<string, { nota: number; justificacion?: string }> = {
  "p-s000": { nota: 88 },
  "p-s001": { nota: 74 },
  "p-s002": { nota: 95 },
  "p-s003": { nota: 55, justificacion: "Sin pruebas y dos funciones no compilan." },
};
const FIXED_TIMES: Record<string, string> = {
  "p-s000": at(-2, "21:14"),
  "p-s001": at(-2, "23:02"),
  "p-s002": at(-3, "18:40"),
  "p-s003": at(-2, "23:58"),
  "p-s004": at(-2, "12:31"),
  "p-s005": at(-2, "22:47"),
  "p-s006": at(-1, "00:12"),
  "p-s007": at(-2, "20:05"),
};

export type SeedBatchEntry = {
  studentId: string;
  fecha: string;
  archivo: string;
  nota: number | null;
  justificacion?: string;
};

export const BATCH_PP_A6: SeedBatchEntry[] = PP_A.estudianteIds
  .filter((id) => id !== "p-ana")
  .concat("p-ana")
  .map((studentId, i) => {
    const graded = GRADED[studentId];
    const fecha =
      studentId === "p-ana"
        ? STUDENT_SUBMISSIONS[0]!.fecha
        : (FIXED_TIMES[studentId] ??
          at(
            -2,
            `${String(13 + ((i * 5) % 10)).padStart(2, "0")}:${String((i * 17) % 60).padStart(2, "0")}`,
          ));
    return {
      studentId,
      fecha,
      archivo: "closures.zip",
      nota: graded?.nota ?? null,
      ...(graded?.justificacion ? { justificacion: graded.justificacion } : {}),
    };
  });

/** Deterministic grade for classmates in the teacher's gradebook: 58 to 98, never random. */
export function seededGrade(studentIndex: number, activityIndex: number): number {
  return 58 + ((studentIndex * 37 + activityIndex * 11 + 7) % 41);
}

export type SeedAppeal = {
  id: string;
  activityId: string;
  sectionId: string;
  studentId: string;
  motivo: string;
  fecha: string;
  estado: "nueva" | "respondida" | "escalada" | "resuelta";
  respuesta?: string;
};

export const APPEALS: SeedAppeal[] = [
  {
    id: "ap-1",
    activityId: "md-quiz-3",
    sectionId: "md-a",
    studentId: "p-s003",
    motivo:
      "En la pregunta 4 usé la contrapositiva y la marcaron mal; creo que el razonamiento es válido.",
    fecha: at(-1, "10:05"),
    estado: "nueva",
  },
  {
    id: "ap-2",
    activityId: "pp-actividades-1-4",
    sectionId: "pp-a",
    studentId: "p-s010",
    motivo: "La Actividad 3 se calificó como atrasada, pero la subí antes de las 23:59.",
    fecha: at(-12, "08:30"),
    estado: "escalada",
    respuesta:
      "El registro muestra las 00:04; lo paso a la administración para revisar el servidor.",
  },
];
