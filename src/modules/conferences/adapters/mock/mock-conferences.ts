import { z } from "zod";

import { academicNow } from "@/lib/clock";
import { parsed } from "@/lib/contract";
import { fail, type PortResult } from "@/lib/result";
import { buildSeed, type Seed, type SeedConference, type SeedReservation } from "@/mock/seed";
import type { Actor } from "@/modules/identity";

import { EVALUATION_DAYS, reserveOutcome, statusOf } from "../../domain/rules";
import { Conference, EvaluationInput } from "../../domain/types";
import type { ConferencePort } from "../../ports/conference-port";

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** Seed plus each user's reservations; capacity counts include the user's own changes. */
export class MockConferences implements ConferencePort {
  private readonly mine = new Map<string, SeedReservation[]>();

  constructor(
    private readonly seed: Seed = buildSeed(),
    private readonly now: () => Date = academicNow,
  ) {}

  private reservations(actor: Actor) {
    let r = this.mine.get(actor.userId);
    if (!r) this.mine.set(actor.userId, (r = structuredClone(this.seed.reservations)));
    return r;
  }

  private view(actor: Actor, c: SeedConference) {
    const all = this.reservations(actor);
    const r = all.find((x) => x.conferenceId === c.id);
    const seeded = this.seed.reservations.find(
      (x) => x.conferenceId === c.id && x.estado === "reservada",
    );
    const inscritos =
      c.inscritos +
      (r?.estado === "reservada" && !seeded ? 1 : 0) -
      (seeded && r?.estado !== "reservada" ? 1 : 0);
    const estado = statusOf({ ...c, inscritos }, r, this.now());
    return {
      ...c,
      inscritos,
      estado,
      ...(r?.posicion ? { posicion: r.posicion } : {}),
      ...(estado === "por_evaluar"
        ? { evaluarHasta: new Date(Date.parse(c.fecha) + EVALUATION_DAYS * 864e5).toISOString() }
        : {}),
    };
  }

  private only(actor: Actor) {
    return actor.role === "estudiante" ? null : fail("forbidden");
  }

  async search(actor: Actor, query = "") {
    const denied = this.only(actor);
    if (denied) return denied;
    const words = fold(query).split(/\s+/).filter(Boolean);
    const list = this.seed.conferences
      .filter((c) => Date.parse(c.fecha) > this.now().getTime())
      .filter((c) => words.every((w) => fold(`${c.titulo} ${c.ponente} ${c.lugar}`).includes(w)))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map((c) => this.view(actor, c));
    return parsed(z.array(Conference), list);
  }

  async listMine(actor: Actor) {
    const denied = this.only(actor);
    if (denied) return denied;
    const ids = new Set(this.reservations(actor).map((r) => r.conferenceId));
    return parsed(
      z.array(Conference),
      this.seed.conferences
        .filter((c) => ids.has(c.id))
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
        .map((c) => this.view(actor, c)),
    );
  }

  async get(actor: Actor, id: string): PortResult<Conference> {
    const denied = this.only(actor);
    if (denied) return denied;
    const c = this.seed.conferences.find((x) => x.id === id);
    return c ? parsed(Conference, this.view(actor, c)) : fail("not_found");
  }

  async reserve(actor: Actor, id: string): PortResult<Conference> {
    const current = await this.get(actor, id);
    if (!current.ok) return current;
    if (!["disponible", "llena"].includes(current.value.estado))
      return fail("invalid", "Ya tienes un lugar o la conferencia pasó");
    const all = this.reservations(actor);
    const waiting = current.value.estado === "llena" ? 3 : 0;
    all.push({ conferenceId: id, ...reserveOutcome(current.value, waiting) });
    return this.get(actor, id);
  }

  async cancel(actor: Actor, id: string): PortResult<Conference> {
    const current = await this.get(actor, id);
    if (!current.ok) return current;
    if (!["reservada", "en_espera"].includes(current.value.estado))
      return fail("invalid", "No hay reserva que cancelar");
    const all = this.reservations(actor);
    all.splice(
      all.findIndex((r) => r.conferenceId === id),
      1,
    );
    return this.get(actor, id);
  }

  async submitEvaluation(actor: Actor, id: string, input: z.input<typeof EvaluationInput>) {
    const body = EvaluationInput.safeParse(input);
    if (!body.success) return fail("invalid", "Elige una calificación de 1 a 5");
    const current = await this.get(actor, id);
    if (!current.ok) return current;
    if (current.value.estado !== "por_evaluar")
      return fail("invalid", "Esta conferencia no está abierta a evaluación");
    const r = this.reservations(actor).find((x) => x.conferenceId === id)!;
    r.evaluacion = body.data;
    return this.get(actor, id);
  }
}
