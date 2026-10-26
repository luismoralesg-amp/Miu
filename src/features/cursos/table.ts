import type { ClassTime, Course } from "@/modules/academic";
import type { CourseGrades, StudentActivity } from "@/modules/assessment";

const DIA = ["", "lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

/** "Lun, mié y jue · 07:00–08:20" */
export function scheduleLabel(h: ClassTime) {
  const days = h.dias.map((d) => DIA[d]!);
  const list = days.length > 1 ? `${days.slice(0, -1).join(", ")} y ${days.at(-1)}` : days[0]!;
  return `${list.charAt(0).toUpperCase()}${list.slice(1)} · ${h.ini}–${h.fin}`;
}

export type CourseRow = {
  id: string;
  nombre: string;
  corto: string;
  slot: number;
  seccion: string;
  facultad: string;
  periodo: string;
  creditos: number;
  catedratico: string;
  auxiliar: string | null;
  horario: string;
  salon: string;
  nota: number | null;
  evaluado: number;
  proxima: { titulo: string; fecha: string; href: string } | null;
};

export function toRows(
  courses: Course[],
  grades: CourseGrades[],
  activities: StudentActivity[],
  now: Date,
): CourseRow[] {
  return courses.map((c) => {
    const g = grades.find((x) => x.curso.id === c.id);
    const next = activities
      .filter(
        (a) =>
          a.curso.id === c.id &&
          (a.estado === "pendiente" || a.estado === "programada") &&
          Date.parse(a.fecha) > now.getTime(),
      )
      .sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
    return {
      id: c.id,
      nombre: c.nombre,
      corto: c.corto,
      slot: c.slot,
      seccion: c.seccion,
      facultad: c.facultad,
      periodo: c.periodo,
      creditos: c.creditos,
      catedratico: c.catedratico.nombre,
      auxiliar: c.auxiliares[0]?.nombre ?? null,
      horario: scheduleLabel(c.horario),
      salon: c.horario.salon,
      nota: g && g.evaluado > 0 ? g.actual : null,
      evaluado: g?.evaluado ?? 0,
      proxima: next
        ? { titulo: next.titulo, fecha: next.fecha, href: `/cursos/${c.id}/actividades/${next.id}` }
        : null,
    };
  });
}

/** Lowercase without accents, so "etica" finds "Ética" and "mendez" finds "Méndez". */
export const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/**
 * Every word of the query must appear in the course, its people, its room or its faculty.
 * "sección B" is read as a section filter, so a lone "b" does not match "Bautista".
 */
export function filterCourses(rows: CourseRow[], query: string): CourseRow[] {
  let q = fold(query);
  const section = /\bseccion\s+(\w+)/.exec(q)?.[1];
  if (section) q = q.replace(/\bseccion\s+\w+/, " ");
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length === 0 && !section) return rows;
  return rows.filter((r) => {
    if (section && fold(r.seccion) !== section) return false;
    const hay = fold(
      [r.nombre, r.corto, r.catedratico, r.auxiliar ?? "", r.salon, r.facultad].join(" "),
    );
    return words.every((w) => hay.includes(w));
  });
}

export const sortKeys = ["nombre", "nota", "proxima", "creditos"] as const;
export type SortKey = (typeof sortKeys)[number];
export const sortLabel: Record<SortKey, string> = {
  nombre: "Nombre",
  nota: "Nota actual",
  proxima: "Próxima entrega",
  creditos: "Créditos",
};

/** Name A–Z; grade high to low; next deadline soonest first (none last); credits high to low. */
export function sortCourses(rows: CourseRow[], key: SortKey): CourseRow[] {
  const byName = (a: CourseRow, b: CourseRow) => a.nombre.localeCompare(b.nombre, "es");
  return [...rows].sort((a, b) => {
    switch (key) {
      case "nombre":
        return byName(a, b);
      case "nota":
        return (b.nota ?? -1) - (a.nota ?? -1) || byName(a, b);
      case "proxima":
        return (
          (a.proxima?.fecha ?? "9999").localeCompare(b.proxima?.fecha ?? "9999") || byName(a, b)
        );
      case "creditos":
        return b.creditos - a.creditos || byName(a, b);
    }
  });
}

/** Groups by faculty and term, in the order the rows arrive (already sorted). */
export function groupCourses(rows: CourseRow[]) {
  const groups = new Map<string, { facultad: string; periodo: string; rows: CourseRow[] }>();
  for (const r of rows) {
    const key = `${r.facultad}·${r.periodo}`;
    if (!groups.has(key)) groups.set(key, { facultad: r.facultad, periodo: r.periodo, rows: [] });
    groups.get(key)!.rows.push(r);
  }
  return [...groups.values()];
}
