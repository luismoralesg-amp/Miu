import { HOY } from "@/lib/clock";

/** Guatemala is UTC-6 all year (no daylight saving), so seeded timestamps carry a fixed offset. */
const OFFSET_MS = -6 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, "0");

/** The calendar day of HOY in Guatemala, as a UTC midnight we can add whole days to. */
const HOY_DAY = (() => {
  const g = new Date(HOY.getTime() + OFFSET_MS);
  return Date.UTC(g.getUTCFullYear(), g.getUTCMonth(), g.getUTCDate());
})();

/**
 * A seeded moment `days` from HOY at local time `hhmm` ("23:59"). Every seeded date goes through here,
 * so the whole seed moves together if HOY ever changes.
 */
export function at(days: number, hhmm = "00:00"): string {
  const d = new Date(HOY_DAY + days * 864e5);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${hhmm}:00-06:00`;
}

/** A seeded calendar day `days` from HOY, as YYYY-MM-DD. */
export function day(days: number): string {
  return at(days).slice(0, 10);
}
