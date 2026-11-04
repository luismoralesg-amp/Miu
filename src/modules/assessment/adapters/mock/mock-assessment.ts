import { z } from "zod";

import { academicNow } from "@/lib/clock";
import { parsed } from "@/lib/contract";
import { fail, ok, type PortError, type PortResult, type Result } from "@/lib/result";
import {
  buildSeed,
  fullName,
  seededGrade,
  type Seed,
  type SeedActivity,
  type SeedAppeal,
  type SeedSection,
} from "@/mock/seed";
import type { Actor } from "@/modules/identity";

import {
  closeReadiness,
  currentGrade,
  hasJustification,
  isLate,
  needsJustification,
  termAverage,
  weighted,
} from "../../domain/rules";
import {
  Appeal,
  AppealInput,
  Batch,
  BatchEntry,
  GradeInput,
  Gradebook,
  QueueItem,
  SectionGradebook,
  StudentActivity,
  Submission,
  SubmitInput,
  type ActivityStatus,
  type TeachingActivityStatus,
} from "../../domain/types";
import type { AssessmentPort } from "../../ports/assessment-port";

type StoredSubmission = z.infer<typeof Submission> & { studentId: string };
type StoredEntry = {
  studentId: string;
  fecha: string;
  archivo: string;
  nota: number | null;
  justificacion?: string;
  estado: "sin_nota" | "guardada" | "publicada";
};
type Workspace = {
  submissions: StoredSubmission[];
  batches: Map<string, StoredEntry[]>;
  closed: Map<string, string>;
  appeals: SeedAppeal[];
};
type Publication = { nota: number; porId: string; fecha: string };

const receipt = (hash: string) => `MIU-E-${hash.slice(0, 8).toUpperCase()}`;
const maskCarne = (carne = "") => carne.replace(/^(\d{4}-)\d{2}(\d{2})$/, "$1••$2");
const GRADED_ONLINE = new Set(["en_linea", "presencial"]);

/**
 * Seed plus a workspace per signed-in user: what one E2E session submits or grades never leaks into
 * another. Grades published by the seeded staff accounts are shared, so a live demo flows from the
 * Auxiliar to the student.
 */
export class MockAssessment implements AssessmentPort {
  private readonly workspaces = new Map<string, Workspace>();
  private readonly published = new Map<string, Publication>();

  constructor(
    private readonly seed: Seed = buildSeed(),
    private readonly now: () => Date = academicNow,
  ) {}

  private ws(actor: Actor): Workspace {
    let ws = this.workspaces.get(actor.userId);
    if (!ws) {
      ws = {
        submissions: this.seed.submissions.map((s) => ({
          ...s,
          recibo: receipt(s.hash),
          tamanoBytes: s.tamanoBytes ?? 18_432,
          atrasada: false,
        })),
        batches: new Map(),
        closed: new Map(),
        appeals: structuredClone(this.seed.appeals),
      };
      this.workspaces.set(actor.userId, ws);
    }
    return ws;
  }

  private isSeedStaff(actor: Actor) {
    return this.seed.people.some((p) => p.userId === actor.userId && p.tipo !== "estudiante");
  }

  private course(id: string) {
    const c = this.seed.courses.find((x) => x.id === id)!;
    return { id: c.id, nombre: c.nombre, corto: c.corto, slot: c.slot };
  }

  private personName(id: string) {
    const p = this.seed.people.find((x) => x.id === id);
    return p ? fullName(p) : "Sin asignar";
  }

  private toActivity(a: SeedActivity) {
    return {
      id: a.id,
      curso: this.course(a.courseId),
      tipo: a.tipo,
      titulo: a.titulo,
      peso: a.peso,
      fecha: a.fecha,
      ...(a.fin ? { fin: a.fin } : {}),
      ...(a.salon ? { salon: a.salon } : {}),
      ...(a.temas ? { temas: a.temas } : {}),
      formato: a.formato,
      modo: a.modo,
      atrasadaPermitida: a.atrasadaPermitida,
      rubrica: a.rubrica.map(([criterio, peso]) => ({ criterio, peso })),
      descripcion: a.descripcion,
    };
  }

  private studentSections(actor: Actor) {
    return this.seed.sections.filter((s) => s.estudianteIds.includes(actor.personId));
  }

  private teachingSections(actor: Actor): SeedSection[] {
    if (actor.role === "maestro")
      return this.seed.sections.filter((s) => s.catedraticoId === actor.personId);
    if (actor.role === "auxiliar")
      return this.seed.sections.filter((s) => s.auxiliarIds.includes(actor.personId));
    return [];
  }

  /** The student's grade for an activity: seeded, or published later by seeded staff. */
  private gradeOf(personId: string, activityId: string) {
    const seeded = this.seed.grades.find((g) => g.activityId === activityId);
    if (personId === this.seed.student.id && seeded) {
      const por = this.seed.people.find((p) => p.id === seeded.porId);
      return {
        nota: seeded.nota,
        por: { id: seeded.porId, nombre: this.personName(seeded.porId), rol: por?.cargo ?? "" },
        fecha: seeded.fecha,
        nueva: seeded.nueva ?? false,
        ...(seeded.comentario ? { comentario: seeded.comentario } : {}),
      };
    }
    const pub = this.published.get(`${activityId}:${personId}`);
    if (!pub) return undefined;
    const por = this.seed.people.find((p) => p.id === pub.porId);
    return {
      nota: pub.nota,
      por: { id: pub.porId, nombre: this.personName(pub.porId), rol: por?.cargo ?? "" },
      fecha: pub.fecha,
      nueva: true,
    };
  }

  /**
   * A grade already given in the seed: the demo student keeps hers; classmates get a stable example
   * grade per activity, so the gradebook, the appeals and the stats agree.
   */
  private seededFor(section: SeedSection, studentId: string, activityId: string) {
    if (studentId === this.seed.student.id)
      return this.gradeOf(studentId, activityId)?.nota ?? null;
    const course = this.seed.activities.filter((a) => a.courseId === section.courseId);
    return seededGrade(
      section.estudianteIds.indexOf(studentId),
      course.findIndex((a) => a.id === activityId),
    );
  }

  private studentActivity(actor: Actor, a: SeedActivity) {
    const entrega = this.ws(actor).submissions.find(
      (s) => s.activityId === a.id && s.studentId === actor.personId,
    );
    const calificacion = this.gradeOf(actor.personId, a.id);
    const now = this.now();
    let estado: ActivityStatus;
    if (calificacion) estado = "calificada";
    else if (entrega) estado = "entregada";
    else if (a.modo === "presencial")
      estado = Date.parse(a.fecha) > now.getTime() ? "programada" : "vencida";
    else if (Date.parse(a.fecha) > now.getTime()) estado = "pendiente";
    else estado = a.atrasadaPermitida ? "pendiente" : "vencida";
    const { studentId, ...submission } = entrega ?? { studentId: "" };
    return {
      ...this.toActivity(a),
      estado,
      ...(entrega ? { entrega: submission } : {}),
      ...(calificacion ? { calificacion } : {}),
    };
  }

  async listActivities(actor: Actor, filter: { courseId?: string } = {}) {
    if (actor.role !== "estudiante") return parsed(z.array(StudentActivity), []);
    const courses = new Set(this.studentSections(actor).map((s) => s.courseId));
    if (filter.courseId && !courses.has(filter.courseId)) return fail("forbidden");
    const list = this.seed.activities
      .filter((a) => (filter.courseId ? a.courseId === filter.courseId : courses.has(a.courseId)))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map((a) => this.studentActivity(actor, a));
    return parsed(z.array(StudentActivity), list);
  }

  async getActivity(actor: Actor, activityId: string) {
    const a = this.seed.activities.find((x) => x.id === activityId);
    if (!a) return fail("not_found");
    if (!this.studentSections(actor).some((s) => s.courseId === a.courseId))
      return fail("forbidden");
    return parsed(StudentActivity, this.studentActivity(actor, a));
  }

  async submit(actor: Actor, activityId: string, input: SubmitInput): PortResult<Submission> {
    const body = SubmitInput.safeParse(input);
    if (!body.success) return fail("invalid", body.error.issues[0]?.message);
    const a = this.seed.activities.find((x) => x.id === activityId);
    if (!a) return fail("not_found");
    if (
      actor.role !== "estudiante" ||
      !this.studentSections(actor).some((s) => s.courseId === a.courseId)
    )
      return fail("forbidden");
    if (GRADED_ONLINE.has(a.modo)) return fail("invalid", "Esta actividad no se entrega en MiU");
    const now = this.now().toISOString();
    const atrasada = isLate(now, a.fecha);
    if (atrasada && !a.atrasadaPermitida) return fail("invalid", "La fecha límite ya pasó");
    if (this.gradeOf(actor.personId, a.id))
      return fail("invalid", "La actividad ya está calificada");
    const ws = this.ws(actor);
    ws.submissions = ws.submissions.filter(
      (s) => !(s.activityId === a.id && s.studentId === actor.personId),
    );
    const submission = {
      recibo: receipt(body.data.hash),
      activityId: a.id,
      fecha: now,
      archivo: body.data.archivo,
      tamanoBytes: body.data.tamanoBytes,
      hash: body.data.hash,
      atrasada,
    };
    ws.submissions.push({ ...submission, studentId: actor.personId });
    return parsed(Submission, submission);
  }

  async getGradebook(actor: Actor): PortResult<Gradebook> {
    if (actor.role !== "estudiante") return fail("forbidden");
    const cursos = this.studentSections(actor).map((section) => {
      const acts = this.seed.activities
        .filter((a) => a.courseId === section.courseId)
        .sort((a, b) => b.fecha.localeCompare(a.fecha));
      const filas = acts.map((a) => {
        const g = this.gradeOf(actor.personId, a.id);
        return {
          activityId: a.id,
          titulo: a.titulo,
          tipo: a.tipo,
          peso: a.peso,
          fecha: g?.fecha ?? a.fecha,
          nota: g?.nota ?? null,
          ...(g
            ? { por: `${g.por.nombre}${g.por.rol ? `, ${g.por.rol.toLowerCase()}` : ""}` }
            : {}),
          nueva: g?.nueva ?? false,
          ...(g?.comentario ? { comentario: g.comentario } : {}),
        };
      });
      const graded = acts.flatMap((a) => {
        const g = this.gradeOf(actor.personId, a.id);
        return g ? [{ peso: a.peso, nota: g.nota }] : [];
      });
      const { evaluado, obtenido } = weighted(graded);
      return {
        curso: this.course(section.courseId),
        catedratico: this.personName(section.catedraticoId),
        auxiliar: section.auxiliarIds[0] ? this.personName(section.auxiliarIds[0]) : null,
        evaluado,
        obtenido,
        actual: currentGrade(evaluado, obtenido),
        nuevas: filas.filter((f) => f.nueva).length,
        filas,
      };
    });
    return parsed(Gradebook, {
      periodo: this.seed.term.id,
      cursos,
      promedio: termAverage(cursos.map((c) => c.actual)),
      historial: this.seed.gradeHistory.map(([periodo, promedio]) => ({ periodo, promedio })),
      metas: this.seed.policy.metas,
      umbral: this.seed.policy.umbralJustificacion,
    });
  }

  /** Activities whose deadline passed, handed in through MiU and not graded in the seed. */
  private gradable(section: SeedSection) {
    return this.seed.activities.filter(
      (a) =>
        a.courseId === section.courseId &&
        !GRADED_ONLINE.has(a.modo) &&
        Date.parse(a.fecha) < this.now().getTime() &&
        !this.seed.grades.some((g) => g.activityId === a.id),
    );
  }

  private entries(actor: Actor, section: SeedSection, activity: SeedActivity): StoredEntry[] {
    const key = `${section.id}:${activity.id}`;
    const ws = this.ws(actor);
    let list = ws.batches.get(key);
    if (!list) {
      const explicit = activity.id === "pp-actividad-6" && section.id === "pp-a";
      list = explicit
        ? this.seed.batchPpA6.map((e) => ({
            ...e,
            estado: e.nota === null ? ("sin_nota" as const) : ("guardada" as const),
          }))
        : section.estudianteIds.map((studentId, i) => {
            const own = this.seed.submissions.find(
              (s) => s.activityId === activity.id && s.studentId === studentId,
            );
            const hora = `${String(14 + ((i * 3) % 9)).padStart(2, "0")}:${String((i * 23) % 60).padStart(2, "0")}`;
            return {
              studentId,
              fecha: own?.fecha ?? `${activity.fecha.slice(0, 10)}T${hora}:00-06:00`,
              archivo:
                own?.archivo ?? activity.formato.replace(/^Archivo /, "entrega").toLowerCase(),
              nota: null,
              estado: "sin_nota" as const,
            };
          });
      ws.batches.set(key, list);
    }
    return list;
  }

  private toEntry(e: StoredEntry, activity: SeedActivity) {
    const p = this.seed.people.find((x) => x.id === e.studentId)!;
    return {
      studentId: e.studentId,
      nombre: fullName(p),
      carne: maskCarne(p.carne),
      fecha: e.fecha,
      archivo: e.archivo,
      atrasada: isLate(e.fecha, activity.fecha),
      nota: e.nota,
      ...(e.justificacion ? { justificacion: e.justificacion } : {}),
      estado: e.estado,
    };
  }

  async listGradingQueue(actor: Actor): PortResult<QueueItem[]> {
    const items = this.teachingSections(actor).flatMap((section) =>
      this.gradable(section).map((a) => {
        const entries = this.entries(actor, section, a);
        return {
          sectionId: section.id,
          seccion: section.seccion,
          curso: this.course(section.courseId),
          activityId: a.id,
          titulo: a.titulo,
          cierre: a.fecha,
          entregadas: entries.length,
          calificadas: entries.filter((e) => e.estado !== "sin_nota").length,
          publicadas: entries.filter((e) => e.estado === "publicada").length,
        };
      }),
    );
    return parsed(z.array(QueueItem), items);
  }

  private findBatch(
    actor: Actor,
    sectionId: string,
    activityId: string,
  ): Result<{ section: SeedSection; activity: SeedActivity }, PortError> {
    const section = this.teachingSections(actor).find((s) => s.id === sectionId);
    if (!section) return fail("forbidden", "No tienes asignada esta sección");
    const activity = this.gradable(section).find((a) => a.id === activityId);
    if (!activity) return fail("not_found");
    return ok({ section, activity });
  }

  async listBatch(actor: Actor, sectionId: string, activityId: string): PortResult<Batch> {
    const found = this.findBatch(actor, sectionId, activityId);
    if (!found.ok) return found;
    const { section, activity } = found.value;
    return parsed(Batch, {
      sectionId: section.id,
      seccion: section.seccion,
      curso: this.course(section.courseId),
      activity: { id: activity.id, titulo: activity.titulo, cierre: activity.fecha },
      umbral: this.seed.policy.umbralJustificacion,
      entradas: this.entries(actor, section, activity).map((e) => this.toEntry(e, activity)),
    });
  }

  async getSectionGradebook(actor: Actor, sectionId: string): PortResult<SectionGradebook> {
    const section = this.teachingSections(actor).find((s) => s.id === sectionId);
    if (!section) return fail("forbidden", "No tienes asignada esta sección");
    const now = this.now().getTime();
    const inSeed = new Set(this.seed.grades.map((g) => g.activityId));
    const inBatch = new Set(this.gradable(section).map((a) => a.id));
    const acts = this.seed.activities
      .filter((a) => a.courseId === section.courseId)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    // Grade of every student on every activity: seeded ones are published; batch ones keep their state.
    type Cell = { nota: number | null; publicada: boolean };
    const cells = new Map<string, Map<string, Cell>>();
    for (const a of acts) {
      const byStudent = new Map<string, Cell>();
      if (inSeed.has(a.id))
        for (const id of section.estudianteIds)
          byStudent.set(id, { nota: this.seededFor(section, id, a.id), publicada: true });
      else if (inBatch.has(a.id))
        for (const e of this.entries(actor, section, a))
          byStudent.set(e.studentId, { nota: e.nota, publicada: e.estado === "publicada" });
      cells.set(a.id, byStudent);
    }

    const total = section.estudianteIds.length;
    const actividades = acts.map((a) => {
      const saved = [...cells.get(a.id)!.values()].filter(
        (c): c is { nota: number; publicada: boolean } => c.nota !== null,
      );
      const publicadas = saved.filter((c) => c.publicada).length;
      const estado: TeachingActivityStatus =
        Date.parse(a.fecha) > now
          ? "programada"
          : saved.length < total
            ? "por_calificar"
            : publicadas < saved.length
              ? "sin_publicar"
              : "publicada";
      return {
        id: a.id,
        titulo: a.titulo,
        tipo: a.tipo,
        peso: a.peso,
        fecha: a.fecha,
        estado,
        calificadas: saved.length,
        publicadas,
        promedio: saved.length ? termAverage(saved.map((c) => c.nota)) : null,
        enLote: inBatch.has(a.id),
      };
    });

    const estudiantes = section.estudianteIds
      .map((id) => {
        const p = this.seed.people.find((x) => x.id === id)!;
        const notas: Record<string, number | null> = {};
        const graded: Array<{ peso: number; nota: number }> = [];
        for (const a of acts) {
          const nota = cells.get(a.id)!.get(id)?.nota ?? null;
          notas[a.id] = nota;
          if (nota !== null) graded.push({ peso: a.peso, nota });
        }
        const { evaluado, obtenido } = weighted(graded);
        return {
          studentId: id,
          nombre: fullName(p),
          carne: maskCarne(p.carne),
          notas,
          evaluado,
          actual: currentGrade(evaluado, obtenido),
        };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

    const umbral = this.seed.policy.umbralJustificacion;
    const evaluados = estudiantes.filter((e) => e.evaluado > 0);
    return parsed(SectionGradebook, {
      sectionId: section.id,
      seccion: section.seccion,
      curso: this.course(section.courseId),
      umbral,
      cerrada: this.ws(actor).closed.has(section.id),
      actividades,
      estudiantes,
      promedio: termAverage(evaluados.map((e) => e.actual)),
      bajoUmbral: evaluados.filter((e) => e.actual < umbral).length,
    });
  }

  async gradeSubmission(actor: Actor, input: GradeInput): PortResult<BatchEntry> {
    const body = GradeInput.safeParse(input);
    if (!body.success) return fail("invalid", body.error.issues[0]?.message);
    const { sectionId, activityId, studentId, nota, justificacion } = body.data;
    const batch = this.findBatch(actor, sectionId, activityId);
    if (!batch.ok) return batch;
    const found = batch.value;
    if (this.ws(actor).closed.has(sectionId)) return fail("invalid", "La nota final ya se cerró");
    const umbral = this.seed.policy.umbralJustificacion;
    if (needsJustification(nota, umbral) && !hasJustification(justificacion))
      return fail("invalid", `Bajo ${umbral} la justificación es obligatoria`);
    const entries = this.entries(actor, found.section, found.activity);
    const entry = entries.find((e) => e.studentId === studentId);
    if (!entry) return fail("not_found", "La persona no entregó en esta sección");
    entry.nota = nota;
    entry.estado = "guardada";
    if (needsJustification(nota, umbral) && justificacion) entry.justificacion = justificacion;
    else delete entry.justificacion;
    return parsed(BatchEntry, this.toEntry(entry, found.activity));
  }

  async publishGrades(actor: Actor, sectionId: string, activityId: string) {
    const batch = this.findBatch(actor, sectionId, activityId);
    if (!batch.ok) return batch;
    const found = batch.value;
    if (this.ws(actor).closed.has(sectionId)) return fail("invalid", "La nota final ya se cerró");
    const fecha = this.now().toISOString();
    let publicadas = 0;
    for (const e of this.entries(actor, found.section, found.activity)) {
      if (e.estado !== "guardada" || e.nota === null) continue;
      e.estado = "publicada";
      publicadas++;
      if (this.isSeedStaff(actor))
        this.published.set(`${activityId}:${e.studentId}`, {
          nota: e.nota,
          porId: actor.personId,
          fecha,
        });
    }
    return parsed(z.object({ publicadas: z.number().int() }), { publicadas });
  }

  async closeFinalGrade(actor: Actor, sectionId: string) {
    if (actor.role !== "maestro") return fail("forbidden", "Solo el Maestro cierra la nota final");
    if (!this.teachingSections(actor).some((s) => s.id === sectionId)) return fail("forbidden");
    const ws = this.ws(actor);
    if (ws.closed.has(sectionId)) return fail("invalid", "Ya está cerrada");
    const book = await this.getSectionGradebook(actor, sectionId);
    if (!book.ok) return book;
    if (!closeReadiness(book.value.actividades).listo)
      return fail("invalid", "Aún hay actividades por calificar o publicar");
    const fecha = this.now().toISOString();
    ws.closed.set(sectionId, fecha);
    return parsed(z.object({ cerrada: z.literal(true), fecha: z.string() }), {
      cerrada: true,
      fecha,
    });
  }

  async isClosed(actor: Actor, sectionId: string) {
    return parsed(z.boolean(), this.ws(actor).closed.has(sectionId));
  }

  private toAppeal(a: SeedAppeal) {
    const activity = this.seed.activities.find((x) => x.id === a.activityId)!;
    const section = this.seed.sections.find((s) => s.id === a.sectionId)!;
    const nota = this.seededFor(section, a.studentId, a.activityId);
    return {
      id: a.id,
      activityId: a.activityId,
      actividad: activity.titulo,
      curso: this.course(activity.courseId),
      sectionId: a.sectionId,
      seccion: section.seccion,
      estudiante: { id: a.studentId, nombre: this.personName(a.studentId) },
      motivo: a.motivo,
      fecha: a.fecha,
      estado: a.estado,
      ...(a.respuesta ? { respuesta: a.respuesta } : {}),
      nota,
    };
  }

  async listAppeals(actor: Actor): PortResult<Appeal[]> {
    const all = this.ws(actor).appeals;
    let mine: SeedAppeal[];
    if (actor.role === "estudiante") mine = all.filter((a) => a.studentId === actor.personId);
    else if (actor.role === "administrativo") mine = all.filter((a) => a.estado === "escalada");
    else {
      const ids = new Set(this.teachingSections(actor).map((s) => s.id));
      mine = all.filter((a) => ids.has(a.sectionId));
    }
    return parsed(
      z.array(Appeal),
      mine.sort((a, b) => b.fecha.localeCompare(a.fecha)).map((a) => this.toAppeal(a)),
    );
  }

  async createAppeal(actor: Actor, input: { activityId: string; motivo: string }) {
    const body = AppealInput.safeParse(input);
    if (!body.success) return fail("invalid", body.error.issues[0]?.message);
    const activity = this.seed.activities.find((a) => a.id === body.data.activityId);
    if (!activity) return fail("not_found");
    const section = this.studentSections(actor).find((s) => s.courseId === activity.courseId);
    if (actor.role !== "estudiante" || !section) return fail("forbidden");
    if (!this.gradeOf(actor.personId, activity.id))
      return fail("invalid", "Solo se apela una nota publicada");
    const ws = this.ws(actor);
    const appeal: SeedAppeal = {
      id: `ap-${ws.appeals.length + 1}-${activity.id}`,
      activityId: activity.id,
      sectionId: section.id,
      studentId: actor.personId,
      motivo: body.data.motivo,
      fecha: this.now().toISOString(),
      estado: "nueva",
    };
    ws.appeals.push(appeal);
    return parsed(Appeal, this.toAppeal(appeal));
  }
}
