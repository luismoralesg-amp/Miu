import type { Route } from "next";

import { daysBetween, hhmm, relativeDay } from "@/lib/clock";

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Typed-routes escape hatch for paths built from data ("/cursos/" + id). */
export const route = (path: string) => path as Route;

/** "Mañana 23:59", "Domingo 23:59", "3 de noviembre": the time only matters within a week. */
export function dueLabel(fecha: string, now: Date) {
  const d = new Date(fecha);
  const n = daysBetween(now, d);
  const r = relativeDay(d, now);
  return cap(n >= 0 && n < 7 ? `${r} ${hhmm(d)}` : r);
}

/** "22 oct", the short form used in tables and timelines. */
export function shortDate(fecha: string) {
  const d = new Date(new Date(fecha).getTime() - 6 * 36e5);
  const m = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${d.getUTCDate()} ${m[d.getUTCMonth()]}`;
}

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
