import { neededFor, projectedFinal, type CourseGrades, type Gradebook } from "@/modules/assessment";

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Term average, its change against the last closed term, and the series for the trend line. */
export function gradeProfile(book: Gradebook) {
  const anterior = book.historial.at(-1)?.promedio ?? null;
  return {
    promedio: book.promedio,
    anterior,
    delta: anterior === null ? null : round1(book.promedio - anterior),
    serie: [
      ...book.historial.map((h) => ({ periodo: h.periodo, valor: h.promedio, enCurso: false })),
      { periodo: book.periodo, valor: book.promedio, enCurso: true },
    ],
  };
}

/**
 * The course bar in three parts of the final 100: earned, lost (already graded, not earned) and still
 * to be graded. They always add up to 100.
 */
export function courseBar(c: Pick<CourseGrades, "evaluado" | "obtenido">) {
  const obtenido = round1(c.obtenido);
  const porEvaluar = round1(100 - c.evaluado);
  return { obtenido, perdido: round1(100 - obtenido - porEvaluar), porEvaluar };
}

export type GoalStatus = {
  meta: number;
  necesita: number;
  estado: "asegurada" | "alcanzable" | "imposible";
};

/** For each target: the grade needed on what is left, or whether it is already secured or lost. */
export function goals(
  c: Pick<CourseGrades, "evaluado" | "obtenido">,
  metas: number[],
): GoalStatus[] {
  return metas.map((meta) => {
    const necesita = neededFor(meta, c.evaluado, c.obtenido);
    return {
      meta,
      necesita,
      estado: necesita === 0 ? "asegurada" : necesita > 100 ? "imposible" : "alcanzable",
    };
  });
}

/** Simulator: final grade if the student gets `x` on what is left, and what that means. */
export function simulate(
  c: Pick<CourseGrades, "evaluado" | "obtenido">,
  x: number,
  metas: number[],
  umbral: number,
) {
  const final = projectedFinal(c.evaluado, c.obtenido, x);
  const sorted = [...metas].sort((a, b) => a - b);
  const reached = sorted.filter((m) => final >= m).at(-1);
  const next = sorted.find((m) => final < m);
  let nota: string;
  if (final < umbral)
    nota = `Quedarías bajo ${umbral}: te faltan ${umbral - final} puntos para aprobar.`;
  else if (reached && next) nota = `Llegas a ${reached} y te faltan ${next - final} para ${next}.`;
  else if (reached) nota = `Llegas a ${reached}.`;
  else nota = `Apruebas, y te faltan ${next! - final} puntos para llegar a ${next}.`;
  return { final, nota };
}
