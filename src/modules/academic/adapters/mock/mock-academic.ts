import { z } from "zod";

import { parsed } from "@/lib/contract";
import { fail, type PortResult } from "@/lib/result";
import { buildSeed, fullName, type Seed, type SeedPerson, type SeedSection } from "@/mock/seed";
import type { Actor } from "@/modules/identity";

import {
  Announcement,
  Course,
  CourseDocument,
  DirectoryPerson,
  PastCourse,
  RosterEntry,
  ScheduleEntry,
  SubsectionContent,
  TeachingSection,
  Term,
  type ContentItem,
  type Subsection,
} from "../../domain/types";
import type { AcademicPort } from "../../ports/academic-port";

const formatKb = (kb: number) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);

/** Masks a carné ("2024-0187" → "2024-••87") and an address ("ana.lopez.demo@ufm.edu" → "a•••@ufm.edu"). */
export const maskCarne = (carne = "") => carne.replace(/^(\d{4}-)\d{2}(\d{2})$/, "$1••$2");
export const maskCorreo = (correo: string) => correo.replace(/^(.)[^@]*(@.*)$/, "$1•••$2");

/** Read-only adapter over the seed. Course content does not change per user, so state is shared. */
export class MockAcademic implements AcademicPort {
  constructor(private readonly seed: Seed = buildSeed()) {}

  private person(id: string): SeedPerson | undefined {
    return this.seed.people.find((p) => p.id === id);
  }

  private ref(id: string) {
    const p = this.person(id);
    return { id, nombre: p ? fullName(p) : "Sin asignar" };
  }

  /** Sections the actor is in, by role: enrolled (student), owner (maestro) or assistant. */
  private sectionsOf(actor: Actor): SeedSection[] {
    const { sections } = this.seed;
    switch (actor.role) {
      case "estudiante":
        return sections.filter((s) => s.estudianteIds.includes(actor.personId));
      case "maestro":
        return sections.filter((s) => s.catedraticoId === actor.personId);
      case "auxiliar":
        return sections.filter((s) => s.auxiliarIds.includes(actor.personId));
      case "administrativo":
        return sections;
    }
  }

  private toCourse(section: SeedSection) {
    const c = this.seed.courses.find((x) => x.id === section.courseId)!;
    return {
      id: c.id,
      nombre: c.nombre,
      corto: c.corto,
      slot: c.slot,
      facultadId: c.facultad,
      facultad: this.seed.faculties[c.facultad],
      periodo: c.periodo,
      creditos: c.creditos,
      sectionId: section.id,
      seccion: section.seccion,
      catedratico: this.ref(section.catedraticoId),
      auxiliares: section.auxiliarIds.map((id) => this.ref(id)),
      horario: section.clases,
      descripcion: c.descripcion,
      objetivos: c.objetivos,
      deshabilitadas: c.deshabilitadas,
      estudiantes: section.estudianteIds.length,
    };
  }

  private sectionFor(actor: Actor, courseId: string) {
    return this.sectionsOf(actor).find((s) => s.courseId === courseId);
  }

  async getTerm(): PortResult<Term> {
    return parsed(Term, this.seed.term);
  }

  async listCurrentEnrollments(actor: Actor): PortResult<Course[]> {
    if (actor.role !== "estudiante") return parsed(z.array(Course), []);
    return parsed(
      z.array(Course),
      this.sectionsOf(actor).map((s) => this.toCourse(s)),
    );
  }

  async getCourse(actor: Actor, courseId: string): PortResult<Course> {
    if (!this.seed.courses.some((c) => c.id === courseId)) return fail("not_found");
    const section = this.sectionFor(actor, courseId);
    if (!section) return fail("forbidden", "No estás en este curso");
    return parsed(Course, this.toCourse(section));
  }

  async getSchedule(actor: Actor): PortResult<ScheduleEntry[]> {
    const entries = this.sectionsOf(actor).flatMap((s) => {
      const c = this.seed.courses.find((x) => x.id === s.courseId)!;
      return s.clases.dias.map((dia) => ({
        courseId: c.id,
        nombre: c.nombre,
        corto: c.corto,
        slot: c.slot,
        sectionId: s.id,
        seccion: s.seccion,
        dia,
        ini: s.clases.ini,
        fin: s.clases.fin,
        salon: s.clases.salon,
      }));
    });
    entries.sort((a, b) => a.dia - b.dia || a.ini.localeCompare(b.ini));
    return parsed(z.array(ScheduleEntry), actor.role === "administrativo" ? [] : entries);
  }

  async listPastEnrollments(actor: Actor): PortResult<PastCourse[]> {
    if (actor.role !== "estudiante") return parsed(z.array(PastCourse), []);
    return parsed(
      z.array(PastCourse),
      this.seed.pastEnrollments.map((e) => {
        const p = this.seed.pensum.find((x) => x.codigo === e.codigo)!;
        return { ...e, nombre: p.nombre, uma: p.uma, area: p.area };
      }),
    );
  }

  async listAnnouncements(actor: Actor, courseId?: string): PortResult<Announcement[]> {
    const mine = new Set(this.sectionsOf(actor).map((s) => s.courseId));
    if (courseId && !mine.has(courseId)) return fail("forbidden");
    const list = this.seed.announcements
      .filter((a) => (courseId ? a.courseId === courseId : mine.has(a.courseId)))
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map((a) => ({
        ...a,
        autor: { ...this.ref(a.autorId), rol: this.person(a.autorId)?.cargo ?? "" },
      }));
    return parsed(z.array(Announcement), list);
  }

  async listDocuments(actor: Actor, courseId: string): PortResult<CourseDocument[]> {
    if (!this.sectionFor(actor, courseId)) return fail("forbidden");
    return parsed(
      z.array(CourseDocument),
      this.seed.documents
        .filter((d) => d.courseId === courseId)
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
        .map((d) => ({ ...d, autor: this.ref(d.autorId) })),
    );
  }

  async getSubsection(
    actor: Actor,
    courseId: string,
    sub: Subsection,
  ): PortResult<SubsectionContent> {
    const section = this.sectionFor(actor, courseId);
    if (!section) return fail("forbidden");
    const course = this.seed.courses.find((c) => c.id === courseId)!;
    if (course.deshabilitadas.includes(sub))
      return parsed(SubsectionContent, { estado: "deshabilitada" });
    const items = this.items(section, sub);
    if (items === null) return fail("not_found", "Subsección sin contenido en el puerto académico");
    return parsed(SubsectionContent, { estado: "habilitada", items });
  }

  private items(section: SeedSection, sub: Subsection): ContentItem[] | null {
    const { seed } = this;
    const courseId = section.courseId;
    switch (sub) {
      case "documentos":
        return seed.documents
          .filter((d) => d.courseId === courseId)
          .map((d) => ({
            id: d.id,
            titulo: d.titulo,
            detalle: `${d.formato} · ${formatKb(d.tamanoKb)} · ${this.ref(d.autorId).nombre}`,
            fecha: d.fecha,
          }));
      case "anuncios":
        return seed.announcements
          .filter((a) => a.courseId === courseId)
          .map((a) => ({ id: a.id, titulo: a.titulo, detalle: a.cuerpo, fecha: a.fecha }));
      case "personas":
        return [
          { id: section.catedraticoId, rol: this.person(section.catedraticoId)?.cargo ?? "" },
          ...section.auxiliarIds.map((id) => ({ id, rol: "Auxiliar" })),
        ].map(({ id, rol }) => ({
          id,
          titulo: this.ref(id).nombre,
          detalle: rol,
          href: `/comunicacion?con=${id}`,
        }));
      case "programa": {
        const course = seed.courses.find((c) => c.id === courseId)!;
        return [
          { id: "descripcion", titulo: "Descripción", detalle: course.descripcion },
          ...course.objetivos.map((o, i) => ({
            id: `obj-${i}`,
            titulo: `Objetivo ${i + 1}`,
            detalle: o,
          })),
        ];
      }
      case "bibliografia":
        return (seed.bibliography[courseId] ?? []).map((b, i) => ({
          id: `bib-${i}`,
          titulo: b.titulo,
          detalle: `${b.autor} (${b.anio}) · ${b.tipo}`,
        }));
      case "foro":
        return (seed.forum[courseId] ?? []).map((f) => ({
          id: f.id,
          titulo: f.titulo,
          detalle: `${this.ref(f.autorId).nombre} · ${f.respuestas} respuestas`,
          fecha: f.ultima,
        }));
      case "blog":
        return [];
      case "enlaces":
        return (seed.links[courseId] ?? []).map((l, i) => ({
          id: `link-${i}`,
          titulo: l.titulo,
          detalle: new URL(l.url).hostname,
          href: l.url,
          externo: true,
        }));
      case "biblioteca":
        return (seed.library[courseId] ?? []).map((l, i) => ({
          id: `lib-${i}`,
          titulo: l.titulo,
          detalle: l.tipo,
        }));
      case "recursos-ia":
        return (seed.aiResources[courseId] ?? []).map((r, i) => ({
          id: `ia-${i}`,
          titulo: r.titulo,
          detalle: r.detalle,
        }));
      default:
        // actividades, notas, examenes and actividad-reciente come from the assessment port.
        return null;
    }
  }

  async listTeachingSections(actor: Actor): PortResult<TeachingSection[]> {
    if (actor.role !== "maestro" && actor.role !== "auxiliar")
      return parsed(z.array(TeachingSection), []);
    return parsed(
      z.array(TeachingSection),
      this.sectionsOf(actor).map((s) => {
        const c = this.seed.courses.find((x) => x.id === s.courseId)!;
        return {
          sectionId: s.id,
          seccion: s.seccion,
          courseId: c.id,
          nombre: c.nombre,
          corto: c.corto,
          slot: c.slot,
          rol: s.catedraticoId === actor.personId ? "catedratico" : "auxiliar",
          catedratico: this.ref(s.catedraticoId),
          auxiliares: s.auxiliarIds.map((id) => this.ref(id)),
          estudiantes: s.estudianteIds.length,
          horario: s.clases,
        };
      }),
    );
  }

  async getRoster(actor: Actor, sectionId: string): PortResult<RosterEntry[]> {
    const section = this.sectionsOf(actor).find((s) => s.id === sectionId);
    if (!section || actor.role === "estudiante") return fail("forbidden");
    const mask = actor.role !== "administrativo";
    return parsed(
      z.array(RosterEntry),
      section.estudianteIds
        .map((id) => this.person(id)!)
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
        .map((p) => ({
          personId: p.id,
          nombre: fullName(p),
          carne: mask ? maskCarne(p.carne) : (p.carne ?? ""),
          correo: mask ? maskCorreo(p.correo) : p.correo,
        })),
    );
  }

  async listCoursePeople(actor: Actor): PortResult<DirectoryPerson[]> {
    const seen = new Map<string, z.input<typeof DirectoryPerson>>();
    for (const s of this.sectionsOf(actor)) {
      const c = this.seed.courses.find((x) => x.id === s.courseId)!;
      for (const id of [s.catedraticoId, ...s.auxiliarIds]) {
        if (id === actor.personId || seen.has(id)) continue;
        seen.set(id, {
          id,
          nombre: this.ref(id).nombre,
          rol: `${this.person(id)?.cargo ?? ""} · ${c.corto}`,
          courseId: c.id,
          slot: c.slot,
        });
      }
    }
    return parsed(z.array(DirectoryPerson), [...seen.values()]);
  }
}
