import type { PensumCourse } from "@/modules/curriculum";
import { prerequisiteChain, unlocks } from "@/modules/curriculum";

/** Course-palette slot per area: identity color only, always next to the area's name. */
export const AREA_SLOT: Record<string, 1 | 2 | 3 | 4 | 5 | 6> = {
  matematica: 1,
  programacion: 2,
  humanidades: 3,
  sistemas: 4,
  electiva: 6,
};

export type Relation = "seleccionado" | "requisito" | "abre" | null;

/**
 * What lights up when a course is selected: everything it needs (transitively) and everything it
 * opens later. Direct links are returned apart, to draw the edges.
 */
export function relations(courses: PensumCourse[], selected: string | null) {
  if (!selected)
    return {
      rel: new Map<string, Relation>(),
      directos: { requisitos: [], abre: [] } as { requisitos: string[]; abre: string[] },
    };
  const req = prerequisiteChain(selected, courses);
  const abre = unlocks(selected, courses);
  const rel = new Map<string, Relation>([[selected, "seleccionado"]]);
  for (const c of req) rel.set(c, "requisito");
  for (const c of abre) rel.set(c, "abre");
  const sel = courses.find((c) => c.codigo === selected);
  return {
    rel,
    directos: {
      requisitos: sel?.prerrequisitos ?? [],
      abre: courses.filter((c) => c.prerrequisitos.includes(selected)).map((c) => c.codigo),
    },
  };
}

export function bySemester(courses: PensumCourse[]) {
  const max = Math.max(...courses.map((c) => c.semestre));
  return Array.from({ length: max }, (_, i) => ({
    semestre: i + 1,
    cursos: courses.filter((c) => c.semestre === i + 1),
  }));
}
