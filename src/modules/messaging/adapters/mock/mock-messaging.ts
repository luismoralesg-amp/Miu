import { academicNow } from "@/lib/clock";
import { parsed } from "@/lib/contract";
import { fail } from "@/lib/result";
import { at, buildSeed, fullName, type Seed } from "@/mock/seed";
import type { Actor } from "@/modules/identity";
import { z } from "zod";

import { SendInput, Thread, ThreadSummary, type Message } from "../../domain/types";
import type { MessagingPort } from "../../ports/messaging-port";

const SEEDED: Record<string, Message[]> = {
  "p-jorge": [
    {
      id: "m1",
      de: "yo",
      texto: "Buenas tardes, ¿el Parcial 2 incluye recurrencias no homogéneas?",
      fecha: at(-2, "16:05"),
    },
    {
      id: "m2",
      de: "otro",
      texto:
        "Solo homogéneas y no homogéneas con término constante. La guía de repaso tiene ejemplos.",
      fecha: at(-2, "18:40"),
    },
  ],
  "p-carlos": [
    {
      id: "m3",
      de: "otro",
      texto: "Ya publiqué la Actividad 5. Si tienes dudas del comentario, escríbeme.",
      fecha: at(0, "05:45"),
    },
  ],
};

/** Threads per signed-in user, between the student and the teachers of their sections (and back). */
export class MockMessaging implements MessagingPort {
  private readonly threads = new Map<string, Map<string, Message[]>>();
  private readonly read = new Map<string, Set<string>>();

  constructor(
    private readonly seed: Seed = buildSeed(),
    private readonly now: () => Date = academicNow,
  ) {}

  private mine(actor: Actor) {
    let t = this.threads.get(actor.userId);
    if (!t) {
      t = new Map(actor.role === "estudiante" ? Object.entries(structuredClone(SEEDED)) : []);
      this.threads.set(actor.userId, t);
    }
    return t;
  }

  /** People the actor may write to: teachers and assistants of their sections, or their students. */
  private contacts(actor: Actor) {
    const s = this.seed.sections;
    const ids =
      actor.role === "estudiante"
        ? s
            .filter((x) => x.estudianteIds.includes(actor.personId))
            .flatMap((x) => [x.catedraticoId, ...x.auxiliarIds])
        : s
            .filter(
              (x) => x.catedraticoId === actor.personId || x.auxiliarIds.includes(actor.personId),
            )
            .flatMap((x) => x.estudianteIds);
    return new Set(ids);
  }

  private person(id: string) {
    const p = this.seed.people.find((x) => x.id === id);
    return p ? { id, nombre: fullName(p), rol: p.cargo ?? "Estudiante" } : null;
  }

  async listThreads(actor: Actor) {
    const read = this.read.get(actor.userId) ?? new Set();
    const list = [...this.mine(actor).entries()]
      .filter(([, m]) => m.length > 0)
      .map(([id, m]) => {
        const p = this.person(id)!;
        const last = m.at(-1)!;
        return {
          personaId: id,
          nombre: p.nombre,
          rol: p.rol,
          ultimo: last.texto,
          fecha: last.fecha,
          noLeidos: last.de === "otro" && !read.has(id) ? 1 : 0,
        };
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
    return parsed(z.array(ThreadSummary), list);
  }

  async getThread(actor: Actor, personaId: string) {
    const p = this.person(personaId);
    if (!p) return fail("not_found");
    if (!this.contacts(actor).has(personaId))
      return fail("forbidden", "Solo puedes escribir a personas de tus cursos");
    let set = this.read.get(actor.userId);
    if (!set) this.read.set(actor.userId, (set = new Set()));
    set.add(personaId);
    return parsed(Thread, { persona: p, mensajes: this.mine(actor).get(personaId) ?? [] });
  }

  async send(actor: Actor, personaId: string, texto: string) {
    const body = SendInput.safeParse({ texto });
    if (!body.success) return fail("invalid", body.error.issues[0]?.message);
    const thread = await this.getThread(actor, personaId);
    if (!thread.ok) return thread;
    const list = this.mine(actor).get(personaId) ?? [];
    list.push({
      id: `m-${list.length + 1}-${personaId}`,
      de: "yo",
      texto: body.data.texto,
      fecha: this.now().toISOString(),
    });
    this.mine(actor).set(personaId, list);
    return this.getThread(actor, personaId);
  }
}
