import type { PastCourse } from "@/modules/academic";

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** Terms newest first, each with its courses and plain average. */
export function groupByTerm(courses: PastCourse[]) {
  const terms = [...new Set(courses.map((c) => c.periodo))].sort().reverse();
  return terms.map((periodo) => {
    const list = courses.filter((c) => c.periodo === periodo);
    return {
      periodo,
      cursos: list,
      promedio: Math.round((list.reduce((s, c) => s + c.nota, 0) / list.length) * 10) / 10,
      uma: list.reduce((s, c) => s + c.uma, 0),
    };
  });
}

/** One search box instead of MiU's seven filters: name, code, term or grade. */
export function searchHistory(courses: PastCourse[], query: string) {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return courses;
  return courses.filter((c) => {
    const hay = fold(`${c.nombre} ${c.codigo} ${c.periodo} ${c.nota} seccion ${c.seccion}`);
    return words.every((w) => hay.includes(w));
  });
}
