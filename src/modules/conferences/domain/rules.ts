import type { ConferenceStatus } from "./types";

/** Days after the talk during which attendees can evaluate it [S]. */
export const EVALUATION_DAYS = 7;
const DAY = 864e5;

type Reservation =
  { estado: "reservada" | "en_espera"; asistio?: boolean; evaluacion?: unknown } | undefined;

/**
 * Where a talk stands for a student: before it, available/full/reserved/waiting; after it, to evaluate
 * (attended, within the window), evaluated, or expired (missed, or the window closed).
 */
export function statusOf(
  conf: { fecha: string; cupo: number; inscritos: number },
  r: Reservation,
  now: Date,
): ConferenceStatus {
  const start = Date.parse(conf.fecha);
  if (start > now.getTime()) {
    if (r) return r.estado;
    return conf.inscritos >= conf.cupo ? "llena" : "disponible";
  }
  if (!r) return "pasada";
  if (r.evaluacion) return "evaluada";
  if (r.estado === "reservada" && r.asistio && now.getTime() - start <= EVALUATION_DAYS * DAY)
    return "por_evaluar";
  return "expirada";
}

/** Reserving a full talk puts you on the waiting list, at the end. */
export function reserveOutcome(conf: { cupo: number; inscritos: number }, waiting: number) {
  return conf.inscritos < conf.cupo
    ? { estado: "reservada" as const }
    : { estado: "en_espera" as const, posicion: waiting + 1 };
}
