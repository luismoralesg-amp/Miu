/**
 * The mock data lives in a fixed week of the 2026-2 semester, so "now" for academic data is fixed too
 * (override with MIU_NOW). Auth timers (codes, sessions) use the real clock.
 */
export const DEMO_NOW = "2026-10-22T07:42:00-06:00";

export function academicNow(): Date {
  return new Date(process.env.MIU_NOW ?? DEMO_NOW);
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** Calendar maths in Guatemala time (UTC-6, no daylight saving). */
const GT_OFFSET_MS = -6 * 60 * 60 * 1000;
const gt = (d: Date) => new Date(d.getTime() + GT_OFFSET_MS);
const dayNumber = (d: Date) => Math.floor(gt(d).getTime() / 864e5);

export function daysBetween(from: Date, to: Date) {
  return dayNumber(to) - dayNumber(from);
}

export function hhmm(d: Date) {
  const g = gt(d);
  return `${String(g.getUTCHours()).padStart(2, "0")}:${String(g.getUTCMinutes()).padStart(2, "0")}`;
}

export function longDate(d: Date) {
  const g = gt(d);
  return `${DIAS[g.getUTCDay()]} ${g.getUTCDate()} de ${MESES[g.getUTCMonth()]}`;
}

/** "hoy", "mañana", "domingo", "3 de noviembre" */
export function relativeDay(d: Date, now: Date) {
  const n = daysBetween(now, d);
  const g = gt(d);
  if (n === 0) return "hoy";
  if (n === 1) return "mañana";
  if (n === -1) return "ayer";
  if (n > 1 && n < 7) return DIAS[g.getUTCDay()]!;
  if (n < 0 && n > -7) return `el ${DIAS[g.getUTCDay()]}`;
  return `${g.getUTCDate()} de ${MESES[g.getUTCMonth()]}`;
}

/** "hace 2 h", "ayer", "el martes" */
export function timeAgo(d: Date, now: Date) {
  const min = Math.round((now.getTime() - d.getTime()) / 6e4);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  if (daysBetween(d, now) === 0) return `hace ${Math.floor(min / 60)} h`;
  return relativeDay(d, now);
}

export function quetzales(n: number) {
  return `Q${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** ISO weekday in Guatemala time: 1 = lunes … 7 = domingo. */
export function weekdayIso(d: Date) {
  return ((gt(d).getUTCDay() + 6) % 7) + 1;
}

export function weekdayName(d: Date) {
  return DIAS[gt(d).getUTCDay()]!;
}

/** Real wall-clock time (auth timers, device "last used"). */
export function realNow() {
  return Date.now();
}
