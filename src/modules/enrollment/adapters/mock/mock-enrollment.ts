import { randomInt } from "node:crypto";

import { z } from "zod";

import { academicNow } from "@/lib/clock";
import { parsed } from "@/lib/contract";
import { fail, ok, type PortResult } from "@/lib/result";
import { at, buildSeed, type Seed } from "@/mock/seed";
import type { Actor } from "@/modules/identity";

import { checkPreferences, isValid } from "../../domain/rules";
import { EnrollmentWindow, OfferCourse, Preference, SavedPreferences } from "../../domain/types";
import type { EnrollmentPort } from "../../ports/enrollment-port";

const STEP_UP_MS = 5 * 60_000;
const SLOTS = [
  { dias: [1, 3], ini: "07:00", fin: "08:20" },
  { dias: [2, 4], ini: "09:00", fin: "10:20" },
  { dias: [1, 3], ini: "10:30", fin: "11:50" },
  { dias: [2, 4], ini: "14:00", fin: "15:20" },
  { dias: [5], ini: "07:00", fin: "09:40" },
  { dias: [1, 3], ini: "16:00", fin: "17:20" },
];
const TEACHERS = [
  "Elena Ortiz",
  "Tomás Rivas",
  "Lorena Díaz",
  "Andrés Polo",
  "Rafael Soto",
  "Clara Méndez",
];

type Workspace = {
  prefs: z.infer<typeof Preference>[];
  guardadas: string | null;
  dropped: string[];
  code?: { value: string; expira: number };
};

/**
 * Next term's assignment over the seed: the offer is every course the student can take now, with two
 * sections each on fixed schedules. Saving and dropping need a fresh one-time code (step-up).
 */
export class MockEnrollment implements EnrollmentPort {
  private readonly ws = new Map<string, Workspace>();

  constructor(
    private readonly seed: Seed = buildSeed(),
    private readonly now: () => Date = academicNow,
    private readonly clock: () => number = Date.now,
  ) {}

  private w(actor: Actor) {
    let x = this.ws.get(actor.userId);
    if (!x) this.ws.set(actor.userId, (x = { prefs: [], guardadas: null, dropped: [] }));
    return x;
  }

  private window() {
    const abre = at(-2, "08:00");
    const cierra = at(6, "23:59");
    const resolucion = at(8, "10:00");
    const n = this.now().getTime();
    const estado =
      n < Date.parse(abre)
        ? "proxima"
        : n <= Date.parse(cierra)
          ? "abierta"
          : n < Date.parse(resolucion)
            ? "cerrada"
            : "resuelta";
    return { periodo: "2027-1", abre, cierra, resolucion, maxUma: 24, estado } as const;
  }

  private offer() {
    const approved = new Set(
      this.seed.pastEnrollments.filter((e) => e.nota >= 61).map((e) => e.codigo),
    );
    return this.seed.pensum
      .filter(
        (c) =>
          !approved.has(c.codigo) &&
          !c.cursoActual &&
          c.prerrequisitos.every((p) => approved.has(p)),
      )
      .map((c, i) => ({
        codigo: c.codigo,
        nombre: c.nombre,
        uma: c.uma,
        area: c.area,
        secciones: ["A", "B"].map((s, k) => {
          const slot = SLOTS[(i * 2 + k) % SLOTS.length]!;
          return {
            id: `${c.codigo}-${s}`,
            seccion: s,
            ...slot,
            catedratico: TEACHERS[(i + k) % TEACHERS.length]!,
            cupo: 30 + ((i * 7 + k * 5) % 15),
          };
        }),
      }));
  }

  private only(actor: Actor) {
    return actor.role === "estudiante" ? null : fail("forbidden");
  }

  private verify(actor: Actor, codigo: string) {
    const c = this.w(actor).code;
    if (!c || c.expira < this.clock()) return fail("invalid", "El código venció; pide uno nuevo");
    if (c.value !== codigo.trim()) return fail("invalid", "El código no coincide");
    delete this.w(actor).code;
    return null;
  }

  async getWindow(actor: Actor) {
    return this.only(actor) ?? parsed(EnrollmentWindow, this.window());
  }

  async listOffer(actor: Actor) {
    return this.only(actor) ?? parsed(z.array(OfferCourse), this.offer());
  }

  async getPreferences(actor: Actor) {
    const denied = this.only(actor);
    if (denied) return denied;
    const x = this.w(actor);
    return parsed(SavedPreferences, { preferencias: x.prefs, guardadas: x.guardadas });
  }

  async requestStepUp(actor: Actor) {
    const denied = this.only(actor);
    if (denied) return denied;
    const value = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const expira = this.clock() + STEP_UP_MS;
    this.w(actor).code = { value, expira };
    return ok({ expira: new Date(expira).toISOString(), codigoPrueba: value });
  }

  async savePreferences(
    actor: Actor,
    prefs: z.input<typeof Preference>[],
    codigo: string,
  ): PortResult<z.infer<typeof SavedPreferences>> {
    const denied = this.only(actor);
    if (denied) return denied;
    if (this.window().estado !== "abierta")
      return fail("invalid", "La ventana de preferencias está cerrada");
    const body = z.array(Preference).safeParse(prefs);
    if (!body.success) return fail("invalid", "Preferencias incompletas");
    const offer = this.offer();
    if (!body.data.every((p) => offer.some((c) => c.codigo === p.codigo)))
      return fail("invalid", "Un curso no está en tu oferta");
    const check = checkPreferences(body.data, offer, this.window().maxUma);
    if (!isValid(check))
      return fail(
        "invalid",
        check.excede
          ? `Pasas de ${this.window().maxUma} UMA`
          : check.choques.length
            ? "Hay cursos que chocan de horario"
            : "Falta elegir sección",
      );
    const bad = this.verify(actor, codigo);
    if (bad) return bad;
    const x = this.w(actor);
    x.prefs = body.data;
    x.guardadas = this.now().toISOString();
    return parsed(SavedPreferences, { preferencias: x.prefs, guardadas: x.guardadas });
  }

  async drop(actor: Actor, courseId: string, codigo: string) {
    const denied = this.only(actor);
    if (denied) return denied;
    const enrolled = this.seed.sections.some(
      (s) => s.courseId === courseId && s.estudianteIds.includes(actor.personId),
    );
    if (!enrolled) return fail("not_found");
    if (this.w(actor).dropped.includes(courseId)) return fail("invalid", "Ya lo botaste");
    const bad = this.verify(actor, codigo);
    if (bad) return bad;
    this.w(actor).dropped.push(courseId);
    return ok({ courseId, fecha: this.now().toISOString() });
  }

  async listDropped(actor: Actor) {
    return this.only(actor) ?? ok([...this.w(actor).dropped]);
  }
}
