import { academicNow } from "@/lib/clock";
import { parsed } from "@/lib/contract";
import { ok, type PortError, type PortResult, type Result } from "@/lib/result";
import { academic, type AcademicPort } from "@/modules/academic";
import { assessment, type AssessmentPort } from "@/modules/assessment";
import type { Actor } from "@/modules/identity";

import { sortInbox, summarize } from "../../domain/rules";
import { Inbox, type InboxItem } from "../../domain/types";
import type { InboxPort } from "../../ports/inbox-port";

export type InboxSources = {
  academic: () => AcademicPort;
  assessment: () => AssessmentPort;
  /** Extra items (payments, the transfer queue) contributed by other modules. */
  extra?: (actor: Actor) => Promise<Result<InboxItem[], PortError>>;
};

const DAY = 864e5;

/**
 * Builds the inbox from the other ports on every read (a projection, not a copy), plus which notices
 * each user already read. Nothing is cached, so submitting or paying is reflected at once.
 */
export class MockInbox implements InboxPort {
  private readonly read = new Map<string, Set<string>>();

  constructor(
    private readonly sources: InboxSources = { academic, assessment },
    private readonly now: () => Date = academicNow,
  ) {}

  private readSet(actor: Actor) {
    let set = this.read.get(actor.userId);
    if (!set) this.read.set(actor.userId, (set = new Set()));
    return set;
  }

  private urgent(fecha: string) {
    return Date.parse(fecha) - this.now().getTime() <= DAY;
  }

  /** The single query behind the list and the count. */
  private async collect(actor: Actor): PortResult<InboxItem[]> {
    const items: InboxItem[] = [];
    const now = this.now().getTime();

    if (actor.role === "estudiante") {
      const acts = await this.sources.assessment().listActivities(actor);
      if (!acts.ok) return acts;
      for (const a of acts.value) {
        const due = Date.parse(a.fecha) - now;
        const href = `/cursos/${a.curso.id}/actividades/${a.id}`;
        if (a.estado === "pendiente" && due < 14 * DAY)
          items.push({
            id: `pendiente-${a.id}`,
            tipo: "pendiente",
            titulo: a.titulo,
            detalle: `${a.curso.nombre} · ${a.formato}`,
            fecha: a.fecha,
            href,
            slot: a.curso.slot,
            urgente: this.urgent(a.fecha),
            icono: "entrega",
          });
        if (a.estado === "programada" && due < 7 * DAY)
          items.push({
            id: `examen-${a.id}`,
            tipo: "pendiente",
            titulo: `${a.titulo} de ${a.curso.corto}`,
            detalle: `${a.salon ?? "Salón por confirmar"} · vale ${a.peso}%`,
            fecha: a.fecha,
            href,
            slot: a.curso.slot,
            urgente: this.urgent(a.fecha),
            icono: "examen",
          });
        if (a.calificacion?.nueva)
          items.push({
            id: `nota-${a.id}`,
            tipo: "aviso",
            titulo: `${a.calificacion.nota} en ${a.titulo}`,
            detalle: `${a.curso.corto} · ${a.calificacion.por.nombre}`,
            fecha: a.calificacion.fecha,
            href: `/notas?curso=${a.curso.id}`,
            slot: a.curso.slot,
            urgente: false,
            icono: "nota",
          });
      }
      const courses = await this.sources.academic().listCurrentEnrollments(actor);
      if (!courses.ok) return courses;
      const slotOf = new Map(courses.value.map((c) => [c.id, c]));
      const anns = await this.sources.academic().listAnnouncements(actor);
      if (!anns.ok) return anns;
      for (const an of anns.value) {
        if (now - Date.parse(an.fecha) > 7 * DAY) continue;
        const c = slotOf.get(an.courseId);
        items.push({
          id: `anuncio-${an.id}`,
          tipo: "aviso",
          titulo: an.titulo,
          detalle: `${c?.corto ?? ""} · ${an.autor.nombre}`,
          fecha: an.fecha,
          href: `/cursos/${an.courseId}/anuncios`,
          ...(c ? { slot: c.slot } : {}),
          urgente: false,
          icono: "anuncio",
        });
      }
      for (const c of courses.value) {
        const docs = await this.sources.academic().listDocuments(actor, c.id);
        if (!docs.ok) return docs;
        for (const d of docs.value) {
          if (now - Date.parse(d.fecha) > 3 * DAY) continue;
          items.push({
            id: `documento-${d.id}`,
            tipo: "aviso",
            titulo: d.titulo,
            detalle: `${c.corto} · ${d.autor.nombre}`,
            fecha: d.fecha,
            href: `/cursos/${c.id}/documentos`,
            slot: c.slot,
            urgente: false,
            icono: "documento",
          });
        }
      }
    }

    if (actor.role === "maestro" || actor.role === "auxiliar") {
      const queue = await this.sources.assessment().listGradingQueue(actor);
      if (!queue.ok) return queue;
      for (const q of queue.value) {
        const faltan = q.entregadas - q.calificadas;
        if (faltan === 0) continue;
        items.push({
          id: `calificar-${q.sectionId}-${q.activityId}`,
          tipo: "pendiente",
          titulo: `${faltan} entregas por calificar`,
          detalle: `${q.titulo} · ${q.curso.corto} ${q.seccion}`,
          fecha: q.cierre,
          href: `/catedra/por-calificar?seccion=${q.sectionId}&actividad=${q.activityId}`,
          slot: q.curso.slot,
          urgente: false,
          icono: "calificar",
        });
      }
      const appeals = await this.sources.assessment().listAppeals(actor);
      if (!appeals.ok) return appeals;
      for (const ap of appeals.value.filter((a) => a.estado === "nueva"))
        items.push({
          id: `apelacion-${ap.id}`,
          tipo: "aviso",
          titulo: `Apelación de ${ap.estudiante.nombre}`,
          detalle: `${ap.actividad} · ${ap.curso.corto} ${ap.seccion}`,
          fecha: ap.fecha,
          href: `/catedra/apelaciones`,
          slot: ap.curso.slot,
          urgente: false,
          icono: "apelacion",
        });
    }

    if (this.sources.extra) {
      const extra = await this.sources.extra(actor);
      if (!extra.ok) return extra;
      items.push(...extra.value);
    }

    const read = this.readSet(actor);
    return ok(sortInbox(items.filter((i) => !(i.tipo === "aviso" && read.has(i.id)))));
  }

  async listItems(actor: Actor): PortResult<Inbox> {
    const items = await this.collect(actor);
    if (!items.ok) return items;
    return parsed(Inbox, summarize(items.value));
  }

  async count(actor: Actor): PortResult<number> {
    const items = await this.collect(actor);
    return items.ok ? ok(items.value.length) : items;
  }

  async markRead(actor: Actor, itemId: string): PortResult<{ total: number }> {
    this.readSet(actor).add(itemId);
    const total = await this.count(actor);
    return total.ok ? ok({ total: total.value }) : total;
  }

  async markAllRead(actor: Actor): PortResult<{ total: number }> {
    const items = await this.collect(actor);
    if (!items.ok) return items;
    for (const i of items.value) if (i.tipo === "aviso") this.readSet(actor).add(i.id);
    const total = await this.count(actor);
    return total.ok ? ok({ total: total.value }) : total;
  }
}
