import type { PensumStatus } from "./types";

type Node = { codigo: string; prerrequisitos: string[] };

/**
 * A course is available when every prerequisite is approved; a course in progress does not unlock
 * anything yet.
 */
export function statusOf(
  course: Node,
  aprobados: ReadonlySet<string>,
  enCurso: ReadonlySet<string>,
): PensumStatus {
  if (aprobados.has(course.codigo)) return "aprobado";
  if (enCurso.has(course.codigo)) return "en_curso";
  return course.prerrequisitos.every((p) => aprobados.has(p)) ? "disponible" : "bloqueado";
}

/** Every course that must be passed before `codigo`, transitively (what lights up on select). */
export function prerequisiteChain(codigo: string, courses: Node[]): string[] {
  const byCode = new Map(courses.map((c) => [c.codigo, c]));
  const seen = new Set<string>();
  const visit = (code: string) => {
    for (const p of byCode.get(code)?.prerrequisitos ?? []) {
      if (seen.has(p)) continue;
      seen.add(p);
      visit(p);
    }
  };
  visit(codigo);
  return [...seen];
}

/** Every course that `codigo` opens, directly or later on. */
export function unlocks(codigo: string, courses: Node[]): string[] {
  const seen = new Set<string>();
  const visit = (code: string) => {
    for (const c of courses) {
      if (c.prerrequisitos.includes(code) && !seen.has(c.codigo)) {
        seen.add(c.codigo);
        visit(c.codigo);
      }
    }
  };
  visit(codigo);
  return [...seen];
}
