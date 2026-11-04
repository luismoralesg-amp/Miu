import { parsed } from "@/lib/contract";
import { acceptsDemoCode, demoCode } from "@/lib/demo-token";
import { fail, ok, type PortResult } from "@/lib/result";
import { at, buildSeed, type Seed } from "@/mock/seed";
import type { Actor } from "@/modules/identity";

import { maskBirth, maskCui } from "../../domain/rules";
import { ContactInput, Drive, Privacy, Profile, SensitiveField } from "../../domain/types";
import type { AccountPort } from "../../ports/account-port";

/** Fictitious identity data for the demo people. */
const PRIVATE: Record<
  string,
  {
    cui: string;
    nacimiento: string;
    telefono: string;
    direccion: string;
    emergencia: { nombre: string; telefono: string };
  }
> = {
  "p-ana": {
    cui: "2847 51963 0101",
    nacimiento: "2005-03-14",
    telefono: "5555-0187",
    direccion: "Zona 10, Ciudad de Guatemala",
    emergencia: { nombre: "Marta de López", telefono: "5555-0142" },
  },
};
const DEFAULT_PRIVATE = {
  cui: "1900 00000 0101",
  nacimiento: "1985-06-01",
  telefono: "5555-0100",
  direccion: "Ciudad de Guatemala",
  emergencia: { nombre: "Contacto de ejemplo", telefono: "5555-0199" },
};

type State = {
  contact?: ContactInput;
  privacy: Privacy;
  drive: boolean;
  code?: { value: string; expira: number };
};

export class MockAccount implements AccountPort {
  /** Codes already used on this instance: a derived code must stay single-use. */
  private readonly spent = new Set<string>();

  private readonly state = new Map<string, State>();

  constructor(
    private readonly seed: Seed = buildSeed(),
    private readonly clock: () => number = Date.now,
  ) {}

  private s(actor: Actor) {
    let x = this.state.get(actor.userId);
    if (!x)
      this.state.set(
        actor.userId,
        (x = {
          privacy: { directorio: false, foto: false, horario: false, correoAvisos: true },
          drive: false,
        }),
      );
    return x;
  }

  private raw(actor: Actor) {
    return PRIVATE[actor.personId] ?? DEFAULT_PRIVATE;
  }

  private verify(actor: Actor, codigo: string) {
    const c = this.s(actor).code;
    const given = codigo.trim();
    const key = `${actor.userId}:${given}`;
    if (this.spent.has(key)) return fail("invalid", "El código venció; pide uno nuevo");
    // Asked on another server instance (serverless): the code is derived, so check it again.
    const derived =
      !c && acceptsDemoCode("stepup-account", actor.userId, given, this.clock(), 5 * 60_000);
    if (!derived) {
      if (!c || c.expira < this.clock()) return fail("invalid", "El código venció; pide uno nuevo");
      if (c.value !== given) return fail("invalid", "El código no coincide");
    }
    delete this.s(actor).code;
    this.spent.add(key);
    return null;
  }

  async getProfile(actor: Actor): PortResult<Profile> {
    const p = this.seed.people.find((x) => x.id === actor.personId);
    const [nombre = actor.nombre, ...rest] = actor.nombre.split(" ");
    const raw = this.raw(actor);
    const c = this.s(actor).contact;
    return parsed(Profile, {
      nombre: p?.nombre ?? nombre,
      apellido: p?.apellido ?? rest.join(" "),
      carne: p?.carne ?? "—",
      correo: p?.correo ?? "",
      carrera: actor.role === "estudiante" ? this.seed.student.carrera : (p?.cargo ?? actor.role),
      telefono: c?.telefono ?? raw.telefono,
      direccion: c?.direccion ?? raw.direccion,
      contactoEmergencia: c
        ? { nombre: c.emergenciaNombre, telefono: c.emergenciaTelefono }
        : raw.emergencia,
      cui: maskCui(raw.cui),
      nacimiento: maskBirth(raw.nacimiento),
    });
  }

  async requestStepUp(actor: Actor) {
    const value = demoCode("stepup-account", actor.userId, Math.floor(this.clock() / (5 * 60_000)));
    // Asking again re-issues the same derived code, so it becomes usable once more.
    this.spent.delete(`${actor.userId}:${value}`);
    const expira = this.clock() + 5 * 60_000;
    this.s(actor).code = { value, expira };
    return ok({ expira: new Date(expira).toISOString(), codigoPrueba: value });
  }

  async reveal(actor: Actor, field: SensitiveField, codigo: string) {
    if (!SensitiveField.safeParse(field).success) return fail("invalid");
    const bad = this.verify(actor, codigo);
    if (bad) return bad;
    const raw = this.raw(actor);
    return ok(field === "cui" ? raw.cui : raw.nacimiento.split("-").reverse().join("/"));
  }

  async updateContact(actor: Actor, input: ContactInput, codigo: string) {
    const body = ContactInput.safeParse(input);
    if (!body.success) return fail("invalid", body.error.issues[0]?.message);
    const bad = this.verify(actor, codigo);
    if (bad) return bad;
    this.s(actor).contact = body.data;
    return this.getProfile(actor);
  }

  async getPrivacy(actor: Actor) {
    return parsed(Privacy, this.s(actor).privacy);
  }

  async setPrivacy(actor: Actor, privacy: Privacy) {
    const body = Privacy.safeParse(privacy);
    if (!body.success) return fail("invalid");
    this.s(actor).privacy = body.data;
    return parsed(Privacy, body.data);
  }

  async getDrive(actor: Actor) {
    const on = this.s(actor).drive;
    return parsed(Drive, {
      conectado: on,
      archivos: on
        ? [
            {
              id: "d1",
              nombre: "Apuntes de Discreta.docx",
              tipo: "Documento",
              modificado: at(-1, "21:10"),
            },
            {
              id: "d2",
              nombre: "Parser JSON · diseño.pdf",
              tipo: "PDF",
              modificado: at(-3, "18:02"),
            },
            {
              id: "d3",
              nombre: "Presupuesto del semestre.xlsx",
              tipo: "Hoja de cálculo",
              modificado: at(-12, "09:30"),
            },
          ]
        : [],
    });
  }

  async setDriveConsent(actor: Actor, granted: boolean) {
    this.s(actor).drive = granted;
    return this.getDrive(actor);
  }
}
