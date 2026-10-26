import { daysBetween, hhmm, weekdayIso } from "@/lib/clock";
import type { Announcement, Course, CourseDocument } from "@/modules/academic";
import type { StudentActivity } from "@/modules/assessment";

export type TimelineKind = "nota" | "documento" | "anuncio" | "clase" | "examen" | "entrega";
export type TimelineFilter = "todo" | "actividades" | "notas" | "anuncios" | "documentos";

export type TimelineEvent = {
  id: string;
  fecha: string;
  tipo: TimelineKind;
  titulo: string;
  detalle: string;
  href?: string;
  pasado: boolean;
  hoy: boolean;
  nueva: boolean;
};

const FILTER_KINDS: Record<Exclude<TimelineFilter, "todo">, TimelineKind[]> = {
  actividades: ["entrega", "examen"],
  notas: ["nota"],
  anuncios: ["anuncio"],
  documentos: ["documento"],
};

/**
 * Everything that happened or will happen in a course, on one line: published grades, documents,
 * announcements, today's class, and upcoming exams and deliveries. Older than two days counts as past
 * (collapsed by default); today's class marks the present.
 */
export function courseTimeline(
  course: Course,
  activities: StudentActivity[],
  announcements: Announcement[],
  documents: CourseDocument[],
  now: Date,
): TimelineEvent[] {
  const day = (iso: string) => daysBetween(now, new Date(iso));
  const past = (iso: string) => day(iso) < -2;
  const recent = (iso: string) => day(iso) >= -2 && day(iso) <= 0;
  const events: TimelineEvent[] = [];

  for (const a of activities) {
    const href = `/cursos/${course.id}/actividades/${a.id}`;
    if (a.calificacion) {
      events.push({
        id: `nota-${a.id}`,
        fecha: a.calificacion.fecha,
        tipo: "nota",
        titulo: a.titulo,
        detalle: `Nota publicada: ${a.calificacion.nota} · ${a.calificacion.por.nombre}`,
        href,
        pasado: past(a.calificacion.fecha),
        hoy: false,
        nueva: a.calificacion.nueva,
      });
    } else if (Date.parse(a.fecha) > now.getTime()) {
      const examen = a.tipo === "examen";
      events.push({
        id: `act-${a.id}`,
        fecha: a.fecha,
        tipo: examen ? "examen" : "entrega",
        titulo: a.titulo,
        detalle: examen
          ? `${hhmm(new Date(a.fecha))} · ${a.salon ?? ""} · vale ${a.peso}%${a.temas ? ` · ${a.temas}` : ""}`
          : `${a.formato} · vale ${a.peso}% · hasta las ${hhmm(new Date(a.fecha))}`,
        href,
        pasado: false,
        hoy: day(a.fecha) === 0,
        nueva: false,
      });
    } else if (a.entrega) {
      events.push({
        id: `ent-${a.id}`,
        fecha: a.entrega.fecha,
        tipo: "entrega",
        titulo: `Entregaste ${a.titulo}`,
        detalle: `${a.entrega.archivo} · recibo ${a.entrega.recibo} · en espera de nota`,
        href,
        pasado: past(a.entrega.fecha),
        hoy: false,
        nueva: false,
      });
    }
  }
  for (const an of announcements)
    events.push({
      id: `an-${an.id}`,
      fecha: an.fecha,
      tipo: "anuncio",
      titulo: an.titulo,
      detalle: `Anuncio · ${an.autor.nombre}`,
      href: `/cursos/${course.id}/anuncios`,
      pasado: past(an.fecha),
      hoy: false,
      nueva: recent(an.fecha),
    });
  for (const d of documents)
    events.push({
      id: `doc-${d.id}`,
      fecha: d.fecha,
      tipo: "documento",
      titulo: d.titulo,
      detalle: `Documento ${d.formato} · ${d.autor.nombre}`,
      href: `/cursos/${course.id}/documentos`,
      pasado: past(d.fecha),
      hoy: false,
      nueva: recent(d.fecha),
    });
  if (course.horario.dias.includes(weekdayIso(now))) {
    const start = `${now.toISOString().slice(0, 10)}T${course.horario.ini}:00-06:00`;
    const ahora = hhmm(now);
    const estado =
      ahora < course.horario.ini ? "hoy" : ahora < course.horario.fin ? "en curso" : "terminó";
    events.push({
      id: "clase-hoy",
      fecha: start,
      tipo: "clase",
      titulo: "Clase de hoy",
      detalle: `${course.horario.ini} a ${course.horario.fin} · ${course.horario.salon} · ${estado}`,
      pasado: false,
      hoy: true,
      nueva: false,
    });
  }
  return events.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export function filterTimeline(events: TimelineEvent[], filter: TimelineFilter) {
  if (filter === "todo") return events;
  const kinds = FILTER_KINDS[filter];
  return events.filter((e) => kinds.includes(e.tipo));
}

/** What the course page puts first: the next activity and the latest announcement. */
export function courseHighlights(
  activities: StudentActivity[],
  announcements: Announcement[],
  now: Date,
) {
  const next = activities
    .filter(
      (a) =>
        (a.estado === "pendiente" || a.estado === "programada") &&
        Date.parse(a.fecha) > now.getTime(),
    )
    .sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
  const last = [...announcements].sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
  return { proxima: next ?? null, ultimoAnuncio: last ?? null };
}
