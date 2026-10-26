/**
 * Fictitious curriculum of Ciencias de la Computación: 8 semesters of 5 courses, with prerequisites
 * and areas. Codes, credits and order are examples, not the UFM's official pensum [S].
 */
export type Area = "matematica" | "programacion" | "sistemas" | "humanidades" | "electiva";

export const AREAS: Record<Area, string> = {
  matematica: "Matemática",
  programacion: "Programación",
  sistemas: "Sistemas",
  humanidades: "Humanidades",
  electiva: "Electivas",
};

export type SeedPensumCourse = {
  codigo: string;
  nombre: string;
  semestre: number;
  area: Area;
  uma: number;
  prerrequisitos: string[];
  /** Course id of the current term, when the student is taking it now. */
  cursoActual?: string;
};

const C = (
  codigo: string,
  nombre: string,
  semestre: number,
  area: Area,
  prerrequisitos: string[] = [],
  extra: Partial<SeedPensumCourse> = {},
): SeedPensumCourse => ({
  codigo,
  nombre,
  semestre,
  area,
  uma: area === "humanidades" ? 3 : 4,
  prerrequisitos,
  ...extra,
});

export const PENSUM: SeedPensumCourse[] = [
  C("MAT-101", "Cálculo I", 1, "matematica"),
  C("CC-101", "Introducción a la programación", 1, "programacion"),
  C("MAT-102", "Lógica matemática", 1, "matematica"),
  C("HUM-101", "Escritura académica", 1, "humanidades"),
  C("CC-102", "Introducción a la computación", 1, "sistemas"),

  C("MAT-201", "Cálculo II", 2, "matematica", ["MAT-101"]),
  C("CC-201", "Programación orientada a objetos", 2, "programacion", ["CC-101"]),
  C("MAT-202", "Álgebra lineal", 2, "matematica", ["MAT-101"]),
  C("HUM-201", "Filosofía", 2, "humanidades"),
  C("CC-202", "Arquitectura de computadoras", 2, "sistemas", ["CC-102"]),

  C("CC-301", "Estructuras de datos", 3, "programacion", ["CC-201"]),
  C("MAT-301", "Probabilidad y estadística", 3, "matematica", ["MAT-201"]),
  C("CC-302", "Sistemas digitales", 3, "sistemas", ["CC-202"]),
  C("HUM-301", "Proceso económico", 3, "humanidades"),
  C("MAT-302", "Ecuaciones diferenciales", 3, "matematica", ["MAT-201"]),

  C("CC-401", "Algoritmos", 4, "programacion", ["CC-301"]),
  C("CC-402", "Sistemas operativos", 4, "sistemas", ["CC-302", "CC-301"]),
  C("FIS-401", "Física", 4, "matematica", ["MAT-201"]),
  C("HUM-401", "Teoría del orden social", 4, "humanidades", ["HUM-301"]),
  C("CC-403", "Ingeniería de software I", 4, "programacion", ["CC-301"]),

  C("MAT-501", "Matemática Discreta", 5, "matematica", ["MAT-102", "MAT-202"], {
    cursoActual: "matematica-discreta",
  }),
  C("CC-501", "Paradigmas de Programación", 5, "programacion", ["CC-301"], {
    cursoActual: "paradigmas-de-programacion",
  }),
  C("HUM-501", "Ética de la Libertad", 5, "humanidades", ["HUM-201"], {
    cursoActual: "etica-de-la-libertad",
  }),
  C("CC-502", "Bases de Datos I", 5, "sistemas", ["CC-301"], { cursoActual: "bases-de-datos-1" }),
  C("CC-503", "Redes de computadoras", 5, "sistemas", ["CC-402"]),

  C("CC-601", "Bases de Datos II", 6, "sistemas", ["CC-502"]),
  C("CC-602", "Compiladores", 6, "programacion", ["CC-501", "MAT-501"]),
  C("CC-603", "Teoría de la computación", 6, "matematica", ["MAT-501"]),
  C("CC-604", "Ingeniería de software II", 6, "programacion", ["CC-403"]),
  C("MAT-601", "Análisis numérico", 6, "matematica", ["MAT-202", "MAT-302"]),

  C("CC-701", "Inteligencia artificial", 7, "programacion", ["CC-401", "MAT-301"]),
  C("CC-702", "Computación gráfica", 7, "programacion", ["MAT-202", "CC-401"]),
  C("CC-703", "Seguridad informática", 7, "sistemas", ["CC-503"]),
  C("ELE-701", "Electiva I", 7, "electiva"),
  C("CC-704", "Sistemas distribuidos", 7, "sistemas", ["CC-402", "CC-503"]),

  C("CC-801", "Aprendizaje automático", 8, "programacion", ["CC-701"]),
  C("CC-802", "Proyecto de graduación", 8, "programacion", ["CC-604"]),
  C("ELE-801", "Electiva II", 8, "electiva", ["ELE-701"]),
  C("HUM-801", "Ética profesional", 8, "humanidades", ["HUM-501"]),
  C("HUM-802", "Emprendimiento", 8, "humanidades", ["HUM-301"]),
];

/** Approved courses of the four terms before this one, with their final grade. */
export const PAST_ENROLLMENTS: Array<{
  periodo: string;
  codigo: string;
  seccion: string;
  nota: number;
}> = [
  ...(
    [
      ["MAT-101", 78],
      ["CC-101", 84],
      ["MAT-102", 80],
      ["HUM-101", 85],
      ["CC-102", 76],
    ] as const
  ).map(([codigo, nota]) => ({ periodo: "2024-2", codigo, seccion: "A", nota })),
  ...(
    [
      ["MAT-201", 80],
      ["CC-201", 84],
      ["MAT-202", 79],
      ["HUM-201", 88],
      ["CC-202", 80],
    ] as const
  ).map(([codigo, nota]) => ({ periodo: "2025-1", codigo, seccion: "B", nota })),
  ...(
    [
      ["CC-301", 85],
      ["MAT-301", 81],
      ["CC-302", 84],
      ["HUM-301", 86],
      ["MAT-302", 79],
    ] as const
  ).map(([codigo, nota]) => ({ periodo: "2025-2", codigo, seccion: "A", nota })),
  ...(
    [
      ["CC-401", 86],
      ["CC-402", 82],
      ["FIS-401", 80],
      ["HUM-401", 88],
      ["CC-403", 83],
    ] as const
  ).map(([codigo, nota]) => ({ periodo: "2026-1", codigo, seccion: "A", nota })),
];

/** Average per past term, derived from PAST_ENROLLMENTS (the trend on Notas). */
export const GRADE_HISTORY: Array<[term: string, promedio: number]> = [
  ...new Set(PAST_ENROLLMENTS.map((e) => e.periodo)),
].map((periodo) => {
  const notas = PAST_ENROLLMENTS.filter((e) => e.periodo === periodo).map((e) => e.nota);
  return [periodo, Math.round((notas.reduce((s, n) => s + n, 0) / notas.length) * 10) / 10];
});
