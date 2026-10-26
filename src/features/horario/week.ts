import { daysBetween, hhmm, weekdayIso } from "@/lib/clock";
import { buildIcs, type IcsEvent } from "@/lib/ics";
import type { ScheduleEntry, Term } from "@/modules/academic";
import type { StudentActivity } from "@/modules/assessment";

const DAY = 864e5;
const NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const toMin = (t: string) => {
  const [h = 0, m = 0] = t.split(":").map(Number);
  return h * 60 + m;
};
/** Calendar date (YYYY-MM-DD) in Guatemala. */
const gtDate = (d: Date) => new Date(d.getTime() - 6 * 36e5).toISOString().slice(0, 10);

export type WeekDay = {
  fecha: string;
  dia: number;
  nombre: string;
  numero: number;
  hoy: boolean;
  pasado: boolean;
};

/** Monday to Sunday of the week that contains `now`. */
export function weekDays(now: Date): WeekDay[] {
  const offset = weekdayIso(now) - 1;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() + (i - offset) * DAY);
    const n = daysBetween(now, d);
    return {
      fecha: gtDate(d),
      dia: i + 1,
      nombre: NAMES[i]!,
      numero: Number(gtDate(d).slice(8, 10)),
      hoy: n === 0,
      pasado: n < 0,
    };
  });
}

export type WeekItem = {
  hora: string;
  tipo: "clase" | "examen" | "entrega";
  titulo: string;
  detalle: string;
  slot: number;
  href: string;
};

/** What happens each day of the week: classes, exams and deliveries, by time. */
export function weekItems(
  days: WeekDay[],
  schedule: ScheduleEntry[],
  activities: StudentActivity[],
) {
  return days.map((d) => {
    const items: WeekItem[] = [
      ...schedule
        .filter((s) => s.dia === d.dia)
        .map((s) => ({
          hora: s.ini,
          tipo: "clase" as const,
          titulo: s.corto,
          detalle: s.salon.split(" ")[0]!,
          slot: s.slot,
          href: `/cursos/${s.courseId}`,
        })),
      ...activities
        .filter((a) => gtDate(new Date(a.fecha)) === d.fecha && a.estado !== "vencida")
        .map((a) => ({
          hora: hhmm(new Date(a.fecha)),
          tipo: a.tipo === "examen" ? ("examen" as const) : ("entrega" as const),
          titulo: a.tipo === "examen" ? `${a.titulo} de ${a.curso.corto}` : a.titulo,
          detalle: a.tipo === "examen" ? (a.salon ?? "").split(" ")[0]! : "Entrega",
          slot: a.curso.slot,
          href: `/cursos/${a.curso.id}/actividades/${a.id}`,
        })),
    ].sort((a, b) => a.hora.localeCompare(b.hora));
    return { ...d, items, carga: loadLevel(items) };
  });
}

export const LOAD_LABEL = ["Libre", "Ligera", "Media", "Pesada"] as const;

/** Load of a day: a class counts 1, a delivery 1.5, an exam 3 (same rule as the ronda 3 week). */
export function loadLevel(items: Pick<WeekItem, "tipo">[]) {
  const peso = items.reduce(
    (s, x) => s + (x.tipo === "examen" ? 3 : x.tipo === "entrega" ? 1.5 : 1),
    0,
  );
  return peso === 0 ? 0 : peso <= 2.5 ? 1 : peso <= 5 ? 2 : 3;
}

export type Block = ScheduleEntry & { top: number; height: number; ahora: boolean };

/** Class blocks on the hour grid (percent of the day's height), with the class in progress marked. */
export function gridBlocks(schedule: ScheduleEntry[], now: Date, desde = 7, hasta = 18): Block[] {
  const span = (hasta - desde) * 60;
  const today = weekdayIso(now);
  const min = toMin(hhmm(now));
  return schedule.map((s) => ({
    ...s,
    top: ((toMin(s.ini) - desde * 60) / span) * 100,
    height: ((toMin(s.fin) - toMin(s.ini)) / span) * 100,
    ahora: s.dia === today && min >= toMin(s.ini) && min < toMin(s.fin),
  }));
}

/**
 * The term's schedule as a calendar: each section repeats weekly until the term ends, and the
 * remaining exams are added once with a reminder.
 */
export function scheduleIcs(
  schedule: ScheduleEntry[],
  term: Term,
  activities: StudentActivity[],
  now: Date,
) {
  const until = new Date(`${term.fin}T23:59:59-06:00`);
  const days = weekDays(now);
  const bySection = new Map<string, ScheduleEntry[]>();
  for (const s of schedule) bySection.set(s.sectionId, [...(bySection.get(s.sectionId) ?? []), s]);
  const events: IcsEvent[] = [...bySection.values()].map((slots) => {
    const first = slots[0]!;
    const day = days.find((d) => d.dia === Math.min(...slots.map((s) => s.dia)))!;
    return {
      uid: `clase-${first.sectionId}`,
      start: new Date(`${day.fecha}T${first.ini}:00-06:00`),
      end: new Date(`${day.fecha}T${first.fin}:00-06:00`),
      titulo: `${first.nombre} · sección ${first.seccion}`,
      lugar: first.salon,
      semanal: { dias: slots.map((s) => s.dia).sort(), hasta: until },
    };
  });
  for (const a of activities.filter(
    (x) => x.tipo === "examen" && Date.parse(x.fecha) > now.getTime(),
  ))
    events.push({
      uid: `examen-${a.id}`,
      start: new Date(a.fecha),
      end: a.fin
        ? new Date(`${gtDate(new Date(a.fecha))}T${a.fin}:00-06:00`)
        : new Date(Date.parse(a.fecha) + 80 * 60_000),
      titulo: `${a.titulo} · ${a.curso.nombre}`,
      ...(a.salon ? { lugar: a.salon } : {}),
      aviso: 60,
    });
  return buildIcs(events, { nombre: `Horario ${term.nombre}`, stamp: now });
}
