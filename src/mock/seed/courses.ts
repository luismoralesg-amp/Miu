import { CLASSMATES } from "./people";
import { at, day } from "./time";

/** Course color = position in the validated palette (`--course-1…6`). Only ever a small mark. */
export type CourseSlot = 1 | 2 | 3 | 4 | 5 | 6;

export const TERM = {
  id: "2026-2",
  nombre: "Semestre 2026-2",
  inicio: day(-80),
  fin: day(45),
  semanas: 18,
} as const;

/** Faculty names are placeholders until the UFM catalog is connected [S]. */
export const FACULTIES = {
  computacion: "Ciencias de la Computación",
  generales: "Estudios Generales",
} as const;
export type FacultyId = keyof typeof FACULTIES;

export const SUBSECTIONS = [
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
export type Subsection = (typeof SUBSECTIONS)[number];

export type SeedCourse = {
  id: string;
  /** Short key used across the seed. */
  key: "MD" | "PP" | "EL" | "BD";
  nombre: string;
  corto: string;
  slot: CourseSlot;
  facultad: FacultyId;
  periodo: string;
  creditos: number;
  descripcion: string;
  objetivos: string[];
  /** Subsections the teacher turned off. Off is not the same as empty. */
  deshabilitadas: Subsection[];
};

export const COURSES: SeedCourse[] = [
  {
    id: "matematica-discreta",
    key: "MD",
    nombre: "Matemática Discreta",
    corto: "Discreta",
    slot: 1,
    facultad: "computacion",
    periodo: TERM.id,
    creditos: 4,
    descripcion:
      "Lógica, conjuntos, inducción, combinatoria, recurrencias, grafos y árboles: el lenguaje con el que se razona sobre programas.",
    objetivos: [
      "Escribir demostraciones por inducción y por contradicción.",
      "Contar con combinatoria y resolver recurrencias lineales.",
      "Modelar problemas con grafos y árboles.",
    ],
    deshabilitadas: ["blog", "recursos-ia"],
  },
  {
    id: "paradigmas-de-programacion",
    key: "PP",
    nombre: "Paradigmas de Programación",
    corto: "Paradigmas",
    slot: 2,
    facultad: "computacion",
    periodo: TERM.id,
    creditos: 4,
    descripcion:
      "Programación funcional, orientada a objetos y lógica comparadas en el mismo problema: closures, recursión, tipos y evaluación.",
    objetivos: [
      "Resolver un problema en tres paradigmas y comparar sus costos.",
      "Usar closures, funciones de orden superior y recursión de cola.",
      "Leer y escribir un parser pequeño.",
    ],
    deshabilitadas: ["blog"],
  },
  {
    id: "etica-de-la-libertad",
    key: "EL",
    nombre: "Ética de la Libertad",
    corto: "Ética",
    slot: 3,
    facultad: "generales",
    periodo: TERM.id,
    creditos: 3,
    descripcion:
      "Lecturas comentadas sobre orden espontáneo, derechos y responsabilidad individual, con ensayos y discusión en clase.",
    objetivos: [
      "Comentar un texto con precisión y en 300 palabras.",
      "Argumentar por escrito una posición y sus objeciones.",
    ],
    deshabilitadas: ["recursos-ia", "examenes"],
  },
  {
    id: "bases-de-datos-1",
    key: "BD",
    nombre: "Bases de Datos I",
    corto: "Bases de Datos",
    slot: 4,
    facultad: "computacion",
    periodo: TERM.id,
    creditos: 4,
    descripcion:
      "Modelo entidad-relación, modelo relacional, normalización y SQL, con laboratorios sobre una base de datos real de ejemplo.",
    objetivos: [
      "Diseñar un modelo entidad-relación y llevarlo a tablas.",
      "Normalizar hasta la tercera forma normal.",
      "Escribir consultas SQL con agregados y subconsultas.",
    ],
    deshabilitadas: ["foro", "blog"],
  },
];

export type SeedSection = {
  id: string;
  courseId: string;
  seccion: string;
  catedraticoId: string;
  auxiliarIds: string[];
  /** Students enrolled, the demo student included where she takes the section. */
  estudianteIds: string[];
  clases: { dias: number[]; ini: string; fin: string; salon: string };
};

const pool0 = CLASSMATES.slice(0, 28).map((p) => p.id);
const pool1 = CLASSMATES.slice(28).map((p) => p.id);

export const SECTIONS: SeedSection[] = [
  {
    id: "md-a",
    courseId: "matematica-discreta",
    seccion: "A",
    catedraticoId: "p-jorge",
    auxiliarIds: ["p-sofia"],
    estudianteIds: ["p-ana", ...pool0.slice(0, 27)],
    clases: { dias: [1, 3, 4], ini: "07:00", fin: "08:20", salon: "D-307" },
  },
  {
    id: "md-b",
    courseId: "matematica-discreta",
    seccion: "B",
    catedraticoId: "p-jorge",
    auxiliarIds: ["p-carlos"],
    estudianteIds: pool1.slice(0, 22),
    clases: { dias: [2, 4], ini: "11:00", fin: "12:20", salon: "D-307" },
  },
  {
    id: "pp-a",
    courseId: "paradigmas-de-programacion",
    seccion: "A",
    catedraticoId: "p-andres",
    auxiliarIds: ["p-carlos"],
    estudianteIds: ["p-ana", ...pool0.slice(0, 23)],
    clases: { dias: [2, 4], ini: "09:00", fin: "10:20", salon: "D-210" },
  },
  {
    id: "el-c",
    courseId: "etica-de-la-libertad",
    seccion: "C",
    catedraticoId: "p-lucia",
    auxiliarIds: [],
    estudianteIds: ["p-ana", ...pool1.slice(4, 34)],
    clases: { dias: [1, 4], ini: "14:00", fin: "15:20", salon: "Auditorio Juan Bautista" },
  },
  {
    id: "bd-b",
    courseId: "bases-de-datos-1",
    seccion: "B",
    catedraticoId: "p-marta",
    auxiliarIds: ["p-diego"],
    estudianteIds: ["p-ana", ...pool0.slice(5, 25)],
    clases: { dias: [1, 3, 5], ini: "10:30", fin: "11:50", salon: "D-105" },
  },
];

/** The demo student's sections this term. */
export const ENROLLMENTS = ["md-a", "pp-a", "el-c", "bd-b"];

export type SeedAnnouncement = {
  id: string;
  courseId: string;
  titulo: string;
  cuerpo: string;
  autorId: string;
  fecha: string;
};

export const ANNOUNCEMENTS: SeedAnnouncement[] = [
  {
    id: "an-md-1",
    courseId: "matematica-discreta",
    titulo: "El Parcial 2 cubre grafos, árboles y recurrencias",
    cuerpo:
      "Traigan calculadora sin memoria. La guía de repaso ya está en Documentos; el viernes no hay clase después del examen.",
    autorId: "p-jorge",
    fecha: at(-3, "18:30"),
  },
  {
    id: "an-md-2",
    courseId: "matematica-discreta",
    titulo: "Horario de atención de la auxiliar",
    cuerpo: "Sofía atiende martes y jueves de 12:30 a 13:30 en la sala de auxiliares.",
    autorId: "p-sofia",
    fecha: at(-24, "09:00"),
  },
  {
    id: "an-pp-1",
    courseId: "paradigmas-de-programacion",
    titulo: "Notas de la Actividad 5 publicadas",
    cuerpo: "Revisen los comentarios en cada entrega. Las dudas, en el foro antes del viernes.",
    autorId: "p-carlos",
    fecha: at(0, "05:40"),
  },
  {
    id: "an-pp-2",
    courseId: "paradigmas-de-programacion",
    titulo: "El proyecto del parser JSON se entrega por repositorio",
    cuerpo:
      "Compartan el repositorio con el auxiliar antes de la fecha límite. Se califica el último commit antes de las 23:59.",
    autorId: "p-andres",
    fecha: at(-6, "10:15"),
  },
  {
    id: "an-el-1",
    courseId: "etica-de-la-libertad",
    titulo: "Traigan la lectura impresa el lunes",
    cuerpo: "Vamos a trabajar sobre el texto en clase; anoten sus preguntas al margen.",
    autorId: "p-lucia",
    fecha: at(-1, "12:00"),
  },
  {
    id: "an-bd-1",
    courseId: "bases-de-datos-1",
    titulo: "Laboratorio 4 se mueve al viernes",
    cuerpo: "Por el Parcial 2 del martes, el laboratorio de SQL pasa al viernes a la misma hora.",
    autorId: "p-marta",
    fecha: at(-2, "16:00"),
  },
];

export type SeedDocument = {
  id: string;
  courseId: string;
  titulo: string;
  formato: "PDF" | "ZIP" | "PPTX" | "SQL";
  tamanoKb: number;
  autorId: string;
  fecha: string;
};

export const COURSE_DOCUMENTS: SeedDocument[] = [
  {
    id: "doc-md-1",
    courseId: "matematica-discreta",
    titulo: "Guía de repaso del Parcial 2",
    formato: "PDF",
    tamanoKb: 820,
    autorId: "p-jorge",
    fecha: at(-1, "17:10"),
  },
  {
    id: "doc-md-2",
    courseId: "matematica-discreta",
    titulo: "Programa 2026-2",
    formato: "PDF",
    tamanoKb: 214,
    autorId: "p-jorge",
    fecha: at(-80, "08:00"),
  },
  {
    id: "doc-md-3",
    courseId: "matematica-discreta",
    titulo: "Diapositivas: grafos y árboles",
    formato: "PPTX",
    tamanoKb: 3_480,
    autorId: "p-jorge",
    fecha: at(-9, "07:00"),
  },
  {
    id: "doc-pp-1",
    courseId: "paradigmas-de-programacion",
    titulo: "Enunciado: ejercicio de llaves",
    formato: "PDF",
    tamanoKb: 96,
    autorId: "p-andres",
    fecha: at(-5, "09:00"),
  },
  {
    id: "doc-pp-2",
    courseId: "paradigmas-de-programacion",
    titulo: "Código base del parser JSON",
    formato: "ZIP",
    tamanoKb: 44,
    autorId: "p-carlos",
    fecha: at(-6, "10:15"),
  },
  {
    id: "doc-el-1",
    courseId: "etica-de-la-libertad",
    titulo: "Lectura: capítulo 3",
    formato: "PDF",
    tamanoKb: 1_150,
    autorId: "p-lucia",
    fecha: at(-8, "14:00"),
  },
  {
    id: "doc-bd-1",
    courseId: "bases-de-datos-1",
    titulo: "Script de la base de ejemplo",
    formato: "SQL",
    tamanoKb: 38,
    autorId: "p-diego",
    fecha: at(-15, "11:50"),
  },
];

export const BIBLIOGRAPHY: Record<
  string,
  Array<{ autor: string; titulo: string; anio: number; tipo: "Obligatoria" | "Complementaria" }>
> = {
  "matematica-discreta": [
    {
      autor: "Rosen, K.",
      titulo: "Discrete Mathematics and Its Applications",
      anio: 2018,
      tipo: "Obligatoria",
    },
    {
      autor: "Lovász, L., Pelikán, J. y Vesztergombi, K.",
      titulo: "Discrete Mathematics: Elementary and Beyond",
      anio: 2003,
      tipo: "Complementaria",
    },
  ],
  "paradigmas-de-programacion": [
    {
      autor: "Abelson, H. y Sussman, G.",
      titulo: "Structure and Interpretation of Computer Programs",
      anio: 1996,
      tipo: "Obligatoria",
    },
  ],
  "etica-de-la-libertad": [
    {
      autor: "Hayek, F.",
      titulo: "Los fundamentos de la libertad",
      anio: 1960,
      tipo: "Obligatoria",
    },
    { autor: "Mises, L.", titulo: "La acción humana", anio: 1949, tipo: "Complementaria" },
  ],
  "bases-de-datos-1": [
    {
      autor: "Elmasri, R. y Navathe, S.",
      titulo: "Fundamentals of Database Systems",
      anio: 2016,
      tipo: "Obligatoria",
    },
  ],
};

export const FORUM: Record<
  string,
  Array<{ id: string; titulo: string; autorId: string; respuestas: number; ultima: string }>
> = {
  "matematica-discreta": [
    {
      id: "f-md-1",
      titulo: "¿Entra el teorema maestro en el parcial?",
      autorId: "p-s003",
      respuestas: 4,
      ultima: at(-1, "21:12"),
    },
  ],
  "paradigmas-de-programacion": [
    {
      id: "f-pp-1",
      titulo: "Dudas de la Actividad 5",
      autorId: "p-s005",
      respuestas: 7,
      ultima: at(0, "06:58"),
    },
    {
      id: "f-pp-2",
      titulo: "¿Se vale usar una librería de tokens en el parser?",
      autorId: "p-s012",
      respuestas: 2,
      ultima: at(-3, "20:40"),
    },
  ],
  "etica-de-la-libertad": [],
};

export const LINKS: Record<string, Array<{ titulo: string; url: string }>> = {
  "matematica-discreta": [
    {
      titulo: "Teoría de grafos (Wikipedia)",
      url: "https://es.wikipedia.org/wiki/Teor%C3%ADa_de_grafos",
    },
  ],
  "paradigmas-de-programacion": [
    { titulo: "Especificación JSON (RFC 8259)", url: "https://www.rfc-editor.org/rfc/rfc8259" },
  ],
  "etica-de-la-libertad": [],
  "bases-de-datos-1": [
    { titulo: "Documentación de PostgreSQL", url: "https://www.postgresql.org/docs/" },
  ],
};

export const LIBRARY: Record<string, Array<{ titulo: string; tipo: string }>> = {
  "matematica-discreta": [{ titulo: "Rosen, edición digital", tipo: "Libro electrónico" }],
  "paradigmas-de-programacion": [{ titulo: "SICP, edición en línea", tipo: "Libro electrónico" }],
  "etica-de-la-libertad": [{ titulo: "Los fundamentos de la libertad", tipo: "Préstamo" }],
  "bases-de-datos-1": [],
};

export const AI_RESOURCES: Record<string, Array<{ titulo: string; detalle: string }>> = {
  "paradigmas-de-programacion": [
    {
      titulo: "Tutor de closures",
      detalle: "Explica tu código paso a paso; no escribe la solución por ti.",
    },
  ],
  "bases-de-datos-1": [],
};
