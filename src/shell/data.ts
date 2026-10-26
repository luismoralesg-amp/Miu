import {
  academicNow,
  daysBetween,
  hhmm,
  quetzales,
  relativeDay,
  weekdayIso,
  weekdayName,
} from "@/lib/clock";
import { ASSIGNMENTS, CLASSES, COURSES, EXAMS, PAYMENT, PEOPLE } from "@/mock/academic";
import type { Role } from "@/modules/identity/domain/types";

import { NAV, SECTIONS, type IconName, type SectionKey } from "./navigation";

export type CommandItem = {
  id: string;
  grupo: "Acciones" | "Secciones" | "Cursos" | "Actividades" | "Personas";
  titulo: string;
  detalle: string;
  href: string;
  icono?: IconName;
  curso?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Extra words that should match (synonyms, verbs). */
  palabras?: string;
  externo?: boolean;
};

function sectionsFor(role: Role): SectionKey[] {
  const nav = NAV[role];
  return [...new Set([...nav.barra, ...nav.mas.flatMap(([, keys]) => keys)])];
}

/** ⌘K content: actions first (it does things, not just finds them), then everything else. */
export function buildCommands(role: Role): CommandItem[] {
  const now = academicNow();
  const actions: CommandItem[] =
    role === "estudiante"
      ? (() => {
          const hoy = weekdayIso(now);
          const clases = CLASSES.filter((c) => c.dias.includes(hoy)).map(
            (c) => COURSES[c.curso].corto,
          );
          const entrega = ASSIGNMENTS[0]!;
          return [
            {
              id: "a-pagar",
              grupo: "Acciones",
              titulo: "Pagar mi saldo",
              detalle: `${quetzales(PAYMENT.monto)} · vence en ${daysBetween(now, new Date(PAYMENT.vence))} días`,
              href: SECTIONS.pagos.path,
              icono: "wallet",
              palabras: "pagar saldo cuota deuda colegiatura",
            },
            {
              id: "a-entregar",
              grupo: "Acciones",
              titulo: `Entregar ${entrega.titulo}`,
              detalle: `${COURSES[entrega.curso].corto} · ${relativeDay(new Date(entrega.fecha), now)} ${hhmm(new Date(entrega.fecha))}`,
              href: SECTIONS.cursos.path,
              icono: "send",
              palabras: "entregar subir tarea",
            },
            {
              id: "a-horario",
              grupo: "Acciones",
              titulo: `Horario del ${weekdayName(now)}`,
              detalle: `${clases.length} clases · ${clases.join(", ")}`,
              href: SECTIONS.semana.path,
              icono: "calendar",
              palabras: "horario clases hoy jueves salon",
            },
            {
              id: "a-simular",
              grupo: "Acciones",
              titulo: "Simular mi nota de Discreta",
              detalle: "¿Qué necesito para 71, 80 o 90?",
              href: SECTIONS.notas.path,
              icono: "chart",
              palabras: "nota simular necesito aprobar",
            },
          ] satisfies CommandItem[];
        })()
      : role === "administrativo"
        ? [
            {
              id: "a-conciliar",
              grupo: "Acciones",
              titulo: "Revisar comprobantes pendientes",
              detalle: "Cola de conciliación",
              href: SECTIONS.conciliacion.path,
              icono: "landmark",
              palabras: "pagos comprobantes conciliar",
            },
          ]
        : [
            {
              id: "a-calificar",
              grupo: "Acciones",
              titulo: "Calificar Actividad 6: closures",
              detalle: "Paradigmas · sección A · 20 por calificar",
              href: SECTIONS.porCalificar.path,
              icono: "list-checks",
              palabras: "calificar notas entregas",
            },
            {
              id: "a-publicar",
              grupo: "Acciones",
              titulo: "Publicar notas",
              detalle: "Revisa el resumen antes de publicar",
              href: SECTIONS.publicar.path,
              icono: "send",
              palabras: "publicar notas",
            },
          ];

  const sections: CommandItem[] = sectionsFor(role).map((k) => {
    const s = SECTIONS[k];
    return {
      id: `s-${k}`,
      grupo: "Secciones",
      titulo: s.titulo,
      detalle: s.descripcion,
      href: s.path,
      icono: s.icono,
      ...(s.externo ? { externo: true } : {}),
    };
  });

  if (role !== "estudiante") return [...actions, ...sections];

  const courses: CommandItem[] = (Object.keys(COURSES) as Array<keyof typeof COURSES>).map((k) => ({
    id: `c-${k}`,
    grupo: "Cursos",
    titulo: COURSES[k].nombre,
    detalle: `Sección ${COURSES[k].seccion} · ${COURSES[k].catedratico}`,
    href: SECTIONS.cursos.path,
    curso: COURSES[k].slot,
  }));
  const activities: CommandItem[] = [
    ...EXAMS.map((x) => ({ ...x, titulo: `${x.titulo} de ${COURSES[x.curso].corto}` })),
    ...ASSIGNMENTS,
  ]
    .filter((x) => new Date(x.fecha) > now)
    .sort((a, b) => Date.parse(a.fecha) - Date.parse(b.fecha))
    .slice(0, 6)
    .map((x) => ({
      id: `t-${x.id}`,
      grupo: "Actividades",
      titulo: x.titulo,
      detalle: `${relativeDay(new Date(x.fecha), now)} ${hhmm(new Date(x.fecha))}`,
      href: SECTIONS.cursos.path,
      curso: COURSES[x.curso].slot,
    }));
  const people: CommandItem[] = PEOPLE.map((p, i) => ({
    id: `p-${i}`,
    grupo: "Personas",
    titulo: p.nombre,
    detalle: p.rol,
    href: SECTIONS.comunicacion.path,
    icono: "user",
  }));

  return [...actions, ...courses, ...activities, ...sections, ...people];
}
