import { daysBetween, hhmm, quetzales, relativeDay, weekdayIso, weekdayName } from "@/lib/clock";
import type {
  Course,
  DirectoryPerson,
  RosterEntry,
  ScheduleEntry,
  TeachingSection,
} from "@/modules/academic";
import type { QueueItem, StudentActivity } from "@/modules/assessment";
import type { Charge, QueuedTransfer } from "@/modules/finance";
import type { Role } from "@/modules/identity";

import { sectionCommands, type CommandItem } from "./commands";

type Slot = 1 | 2 | 3 | 4 | 5 | 6;

/** What each role's index is built from; absent pieces (a port that failed) are simply left out. */
export type IndexData = {
  courses?: Course[] | undefined;
  activities?: StudentActivity[] | undefined;
  charges?: Charge[] | undefined;
  people?: DirectoryPerson[] | undefined;
  schedule?: ScheduleEntry[] | undefined;
  sections?: TeachingSection[] | undefined;
  queue?: QueueItem[] | undefined;
  roster?: Array<RosterEntry & { sectionId: string; curso: string }> | undefined;
  transfers?: QueuedTransfer[] | undefined;
};

/**
 * ⌘K content by role, from the same ports as the screens. A student finds their courses,
 * activities, charges and teachers; teaching roles find their sections, queue and students; the
 * Administrativo finds the transfer queue. Nothing from another role's scope is ever indexed.
 */
export function buildCommandIndex(role: Role, d: IndexData, now: Date): CommandItem[] {
  const out: CommandItem[] = [];
  if (role === "estudiante") {
    const pending = (d.charges ?? []).filter((c) => c.estado === "pendiente");
    const next = (d.activities ?? [])
      .filter((a) => a.estado === "pendiente" && Date.parse(a.fecha) > now.getTime())
      .sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
    const today = (d.schedule ?? []).filter((s) => s.dia === weekdayIso(now));
    const first = d.courses?.[0];
    if (pending[0])
      out.push({
        id: "a-pagar",
        grupo: "Acciones",
        titulo: "Pagar mi saldo",
        detalle: `${quetzales(pending[0].monto)} · vence en ${pending[0].diasParaVencer} días`,
        href: `/pagos/pagar/${pending[0].id}`,
        icono: "wallet",
        palabras: "pagar saldo cuota deuda colegiatura",
      });
    if (next)
      out.push({
        id: "a-entregar",
        grupo: "Acciones",
        titulo: `Entregar ${next.titulo}`,
        detalle: `${next.curso.corto} · ${relativeDay(new Date(next.fecha), now)} ${hhmm(new Date(next.fecha))}`,
        href: `/cursos/${next.curso.id}/actividades/${next.id}`,
        icono: "send",
        palabras: "entregar subir tarea",
      });
    out.push({
      id: "a-horario",
      grupo: "Acciones",
      titulo: `Horario del ${weekdayName(now)}`,
      detalle: today.length
        ? `${today.length} clases · ${today.map((c) => c.corto).join(", ")}`
        : "Hoy no tienes clases",
      href: "/horario",
      icono: "calendar",
      palabras: "horario clases hoy salon",
    });
    if (first)
      out.push({
        id: "a-simular",
        grupo: "Acciones",
        titulo: `Simular mi nota de ${first.corto}`,
        detalle: "¿Qué necesito para 71, 80 o 90?",
        href: `/notas?curso=${first.id}`,
        icono: "chart",
        palabras: "nota simular necesito aprobar",
      });
    for (const c of d.courses ?? [])
      out.push({
        id: `c-${c.id}`,
        grupo: "Cursos",
        titulo: c.nombre,
        detalle: `Sección ${c.seccion} · ${c.catedratico.nombre}`,
        href: `/cursos/${c.id}`,
        curso: c.slot as Slot,
        palabras: c.corto,
      });
    for (const a of (d.activities ?? [])
      .filter(
        (x) =>
          (x.estado === "pendiente" || x.estado === "programada") &&
          Date.parse(x.fecha) > now.getTime(),
      )
      .sort((x, y) => x.fecha.localeCompare(y.fecha)))
      out.push({
        id: `t-${a.id}`,
        grupo: "Actividades",
        titulo: a.tipo === "examen" ? `${a.titulo} de ${a.curso.corto}` : a.titulo,
        detalle: `${a.curso.corto} · ${relativeDay(new Date(a.fecha), now)} ${hhmm(new Date(a.fecha))}`,
        href: `/cursos/${a.curso.id}/actividades/${a.id}`,
        curso: a.curso.slot as Slot,
        palabras: a.tipo,
      });
    for (const c of pending)
      out.push({
        id: `p-${c.id}`,
        grupo: "Pagos",
        titulo: c.concepto,
        detalle: `${quetzales(c.monto)} · ${c.diasParaVencer < 0 ? "vencido" : `vence en ${daysBetween(now, new Date(`${c.vence}T12:00:00-06:00`))} días`} · ${c.referencia}`,
        href: `/pagos/pagar/${c.id}`,
        icono: "wallet",
        palabras: "pagar cargo",
      });
    for (const p of d.people ?? [])
      out.push({
        id: `pe-${p.id}`,
        grupo: "Personas",
        titulo: p.nombre,
        detalle: p.rol,
        href: `/comunicacion?con=${p.id}`,
        icono: "user",
        palabras: "escribir mensaje",
      });
  }

  if (role === "maestro" || role === "auxiliar") {
    const queue = (d.queue ?? [])
      .filter((q) => q.entregadas > q.calificadas)
      .sort((a, b) => a.cierre.localeCompare(b.cierre));
    for (const q of queue.slice(0, 3))
      out.push({
        id: `a-calificar-${q.sectionId}-${q.activityId}`,
        grupo: "Acciones",
        titulo: `Calificar ${q.titulo}`,
        detalle: `${q.curso.corto} · sección ${q.seccion} · ${q.entregadas - q.calificadas} por calificar`,
        href: `/catedra/por-calificar?seccion=${q.sectionId}&actividad=${q.activityId}`,
        icono: "list-checks",
        palabras: "calificar notas entregas",
      });
    for (const s of d.sections ?? [])
      out.push({
        id: `c-${s.sectionId}`,
        grupo: "Cursos",
        titulo: `${s.nombre} · ${s.seccion}`,
        detalle: `${s.estudiantes} estudiantes · ${s.rol === "catedratico" ? "tu curso" : "auxiliar"}`,
        href: `/catedra/secciones/${s.sectionId}`,
        curso: s.slot as Slot,
        palabras: `${s.corto} seccion`,
      });
    for (const r of d.roster ?? [])
      out.push({
        id: `pe-${r.sectionId}-${r.personId}`,
        grupo: "Personas",
        titulo: r.nombre,
        detalle: `${r.curso} · ${r.carne}`,
        href: `/catedra/secciones/${r.sectionId}`,
        icono: "user",
        palabras: "estudiante",
      });
  }

  if (role === "administrativo") {
    const pend = (d.transfers ?? []).filter((t) => t.estado === "pendiente");
    out.push({
      id: "a-conciliar",
      grupo: "Acciones",
      titulo: "Revisar comprobantes pendientes",
      detalle: `${pend.length} en la cola de conciliación`,
      href: "/admin/pagos",
      icono: "landmark",
      palabras: "pagos comprobantes conciliar aprobar",
    });
    for (const t of pend)
      out.push({
        id: `p-${t.id}`,
        grupo: "Pagos",
        titulo: `${t.alumno} · ${t.concepto}`,
        detalle: `${quetzales(t.monto)} · ${t.banco} · boleta ${t.boleta}`,
        href: `/admin/pagos?transferencia=${t.id}`,
        icono: "landmark",
        palabras: `${t.carne} comprobante`,
      });
  }

  return [...out, ...sectionCommands(role)];
}
