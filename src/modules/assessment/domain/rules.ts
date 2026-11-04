/** Pure grading rules. No I/O, so they are tested directly and reused by every adapter. */

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Weight graded so far and points earned within it, from (weight, grade) pairs. */
export function weighted(items: Array<{ peso: number; nota: number }>) {
  const evaluado = items.reduce((s, i) => s + i.peso, 0);
  const obtenido = items.reduce((s, i) => s + (i.peso * i.nota) / 100, 0);
  return { evaluado, obtenido: Math.round(obtenido * 100) / 100 };
}

/** Grade over what was evaluated, 0–100 with one decimal (0 when nothing is graded yet). */
export function currentGrade(evaluado: number, obtenido: number) {
  return evaluado === 0 ? 0 : round1((obtenido / evaluado) * 100);
}

/** Plain average of the course grades: how MiU reports the term average. */
export function termAverage(grades: number[]) {
  return grades.length === 0 ? 0 : round1(grades.reduce((s, g) => s + g, 0) / grades.length);
}

/**
 * Grade needed on everything still ungraded to finish with `meta`. Above 100 means it can no longer be
 * reached; 0 or less means it is already secured.
 */
export function neededFor(meta: number, evaluado: number, obtenido: number) {
  const restante = 100 - evaluado;
  if (restante <= 0) return obtenido >= meta ? 0 : Infinity;
  return Math.max(0, Math.ceil((meta - obtenido) / (restante / 100)));
}

/** Final grade if the student gets `x` on everything still ungraded. */
export function projectedFinal(evaluado: number, obtenido: number, x: number) {
  return Math.round(obtenido + ((100 - evaluado) / 100) * x);
}

/** The grader must explain any grade under the threshold (61 by default [S]). */
export function needsJustification(nota: number, umbral: number) {
  return nota < umbral;
}

export function hasJustification(text: string | undefined) {
  return (text?.trim().length ?? 0) >= 10;
}

export function isLate(entregado: string, limite: string) {
  return Date.parse(entregado) > Date.parse(limite);
}

type ClosableActivity = {
  titulo: string;
  estado: "programada" | "por_calificar" | "sin_publicar" | "publicada";
};

/**
 * Whether a section's final grade can be closed [S]: nothing may be left to grade or publish. Activities
 * that haven't happened yet don't block, but the person closing has to confirm they won't count.
 */
export function closeReadiness<T extends ClosableActivity>(actividades: T[]) {
  const bloqueos = actividades.filter(
    (a) => a.estado === "por_calificar" || a.estado === "sin_publicar",
  );
  const programadas = actividades.filter((a) => a.estado === "programada");
  return { listo: bloqueos.length === 0, bloqueos, programadas };
}
