import { daysBetween, hhmm, longDate, weekdayIso } from "@/lib/clock";
import type { ScheduleEntry, Term } from "@/modules/academic";
import type { StudentActivity } from "@/modules/assessment";
import type { Balance } from "@/modules/finance";
import type { InboxItem } from "@/modules/inbox";

const H = 36e5;
const toMin = (t: string) => {
  const [h = 0, m = 0] = t.split(":").map(Number);
  return h * 60 + m;
};
const hourOf = (d: Date) => toMin(hhmm(d)) / 60;

export type HeroState = "urgente" | "normal";

/** Deliveries and exams that still need the student, soonest first. */
export function upcoming(activities: StudentActivity[], now: Date) {
  return activities
    .filter(
      (a) =>
        (a.estado === "pendiente" || a.estado === "programada") &&
        Date.parse(a.fecha) > now.getTime(),
    )
    .sort((a, b) => Date.parse(a.fecha) - Date.parse(b.fecha));
}

/**
 * The one thing Hoy puts first: the next exam or delivery within 72 h. Urgent under 24 h (red),
 * normal up to 72 h; beyond that nothing is urgent and Hoy says so.
 */
export function pickHero(activities: StudentActivity[], now: Date) {
  const next = upcoming(activities, now)[0];
  if (!next) return null;
  const hours = (Date.parse(next.fecha) - now.getTime()) / H;
  if (hours > 72) return null;
  return { activity: next, estado: (hours <= 24 ? "urgente" : "normal") as HeroState };
}

export type DayClass = ScheduleEntry & {
  estado: "pasada" | "ahora" | "proxima";
  left: number;
  width: number;
};

/** Today's classes on a time axis (07:00–18:00, widened if a class falls outside), with free gaps. */
export function dayTimeline(schedule: ScheduleEntry[], now: Date) {
  const today = weekdayIso(now);
  const list = schedule.filter((s) => s.dia === today).sort((a, b) => toMin(a.ini) - toMin(b.ini));
  const desde = Math.min(7, ...list.map((c) => Math.floor(toMin(c.ini) / 60)));
  const hasta = Math.max(18, ...list.map((c) => Math.ceil(toMin(c.fin) / 60)));
  const A = desde * 60;
  const B = hasta * 60;
  const pos = (m: number) => ((m - A) / (B - A)) * 100;
  const ahora = toMin(hhmm(now));
  const clases: DayClass[] = list.map((c) => {
    const a = toMin(c.ini);
    const b = toMin(c.fin);
    return {
      ...c,
      estado: ahora >= b ? "pasada" : ahora >= a ? "ahora" : "proxima",
      left: pos(a),
      width: pos(b) - pos(a),
    };
  });
  const huecos: Array<{ min: number; left: number; width: number; desde: string; hasta: string }> =
    [];
  for (let i = 0; i < clases.length - 1; i++) {
    const a = toMin(clases[i]!.fin);
    const b = toMin(clases[i + 1]!.ini);
    if (b - a >= 30)
      huecos.push({
        min: b - a,
        left: pos(a),
        width: pos(b) - pos(a),
        desde: clases[i]!.fin,
        hasta: clases[i + 1]!.ini,
      });
  }
  const ahoraPos = pos(ahora);
  return {
    clases,
    huecos,
    libre: huecos.reduce((s, h) => s + h.min, 0),
    eje: { desde, hasta },
    ahoraPos: ahoraPos >= 0 && ahoraPos <= 100 ? ahoraPos : null,
  };
}

export function duration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function greeting(now: Date) {
  const h = hourOf(now);
  return h < 12 ? "Buenos días" : h < 18 ? "Buenas tardes" : "Buenas noches";
}

export type Variant = "dia" | "noche" | "examenes";

/** Exam week wins; otherwise after 18:00 Hoy looks back at the day and ahead to tomorrow. */
export function variantFor(now: Date, term: Pick<Term, "semanaExamenes">): Variant {
  const day = new Date(now.getTime() - 6 * H).toISOString().slice(0, 10);
  const w = term.semanaExamenes;
  if (w && day >= w.desde && day <= w.hasta) return "examenes";
  return hourOf(now) >= 18 ? "noche" : "dia";
}

/** Study time per day from today to the last exam: 07:00–21:00 minus classes and exams. */
export function freeHoursUntil(exams: StudentActivity[], schedule: ScheduleEntry[], now: Date) {
  const last = exams.at(-1);
  if (!last) return [];
  const days = daysBetween(now, new Date(last.fecha));
  return Array.from({ length: days + 1 }, (_, i) => {
    const date = new Date(now.getTime() + i * 24 * H);
    const dia = weekdayIso(date);
    const busy = [
      ...schedule.filter((s) => s.dia === dia).map((s) => [toMin(s.ini), toMin(s.fin)] as const),
      ...exams
        .filter((x) => daysBetween(now, new Date(x.fecha)) === i)
        .map(
          (x) => [toMin(hhmm(new Date(x.fecha))), toMin(x.fin ?? hhmm(new Date(x.fecha)))] as const,
        ),
    ];
    const start = i === 0 ? Math.max(7 * 60, toMin(hhmm(now))) : 7 * 60;
    const end = 21 * 60;
    const taken = busy.reduce(
      (s, [a, b]) => s + Math.max(0, Math.min(b, end) - Math.max(a, start)),
      0,
    );
    return {
      fecha: date.toISOString(),
      minutos: Math.max(0, end - start - taken),
      examen: exams.find((x) => daysBetween(now, new Date(x.fecha)) === i) ?? null,
    };
  });
}

export type TodayInput = {
  now: Date;
  term: Term;
  schedule: ScheduleEntry[];
  activities: StudentActivity[];
  avisos: InboxItem[];
  balance: Balance | null;
};

/** Everything the student's Hoy shows, derived from the ports' data and the clock. */
export function buildToday({ now, term, schedule, activities, avisos, balance }: TodayInput) {
  const hero = pickHero(activities, now);
  // Same 14-day window as the Bandeja, so "Ver las N" matches what the list shows there.
  const pending = upcoming(activities, now).filter(
    (a) =>
      a.estado === "pendiente" &&
      a.id !== hero?.activity.id &&
      Date.parse(a.fecha) - now.getTime() < 14 * 24 * H,
  );
  const next = upcoming(activities, now)[0] ?? null;
  const fecha = longDate(now);
  const proximo = balance?.proximo ?? null;
  const tomorrow = new Date(now.getTime() + 24 * H);
  const isTomorrow = (iso: string) => daysBetween(now, new Date(iso)) === 1;
  const exams = upcoming(activities, now).filter((a) => a.tipo === "examen");
  const window = term.semanaExamenes;
  return {
    fecha: fecha.charAt(0).toUpperCase() + fecha.slice(1),
    semana: {
      actual: Math.floor(daysBetween(new Date(`${term.inicio}T12:00:00-06:00`), now) / 7) + 1,
      total: term.semanas,
    },
    saludo: greeting(now),
    variante: variantFor(now, term),
    hero,
    siguiente: hero ? null : next,
    dia: dayTimeline(schedule, now),
    porEntregar: pending.slice(0, 4),
    totalPendientes: pending.length,
    novedades: avisos.slice(0, 4),
    nuevas: avisos.length,
    aviso:
      proximo && proximo.diasParaVencer <= 7
        ? {
            chargeId: proximo.id,
            monto: proximo.monto,
            dias: proximo.diasParaVencer,
            vence: proximo.vence,
          }
        : null,
    noche: {
      clasesHoy: schedule.filter((s) => s.dia === weekdayIso(now)),
      entregadasHoy: activities.filter(
        (a) => a.entrega && daysBetween(now, new Date(a.entrega.fecha)) === 0,
      ),
      manana: [
        ...activities
          .filter((a) => a.tipo === "examen" && isTomorrow(a.fecha) && a.id !== hero?.activity.id)
          .map((a) => ({
            hora: hhmm(new Date(a.fecha)),
            titulo: `${a.titulo} de ${a.curso.nombre}`,
            lugar: a.salon ?? "",
            slot: a.curso.slot,
            examen: true,
            href: `/cursos/${a.curso.id}/actividades/${a.id}`,
          })),
        ...schedule
          .filter((s) => s.dia === weekdayIso(tomorrow))
          .map((s) => ({
            hora: s.ini,
            titulo: s.nombre,
            lugar: s.salon,
            slot: s.slot,
            examen: false,
            href: `/cursos/${s.courseId}`,
          })),
        ...activities
          .filter((a) => a.estado === "pendiente" && isTomorrow(a.fecha))
          .map((a) => ({
            hora: hhmm(new Date(a.fecha)),
            titulo: `Entrega: ${a.titulo}`,
            lugar: a.curso.corto,
            slot: a.curso.slot,
            examen: false,
            href: `/cursos/${a.curso.id}/actividades/${a.id}`,
          })),
      ].sort((a, b) => a.hora.localeCompare(b.hora)),
      fechaManana: longDate(tomorrow),
    },
    examenes: window
      ? {
          lista: exams.filter((x) => x.fecha.slice(0, 10) <= window.hasta),
          libres: freeHoursUntil(
            exams.filter((x) => x.fecha.slice(0, 10) <= window.hasta),
            schedule,
            now,
          ),
        }
      : null,
  };
}

export type Today = ReturnType<typeof buildToday>;
