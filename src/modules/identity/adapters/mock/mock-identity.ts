import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";

import { fail, ok, type Result } from "@/lib/result";

import {
  CODE_TTL_MS,
  LINK_TTL_MS,
  MAX_ATTEMPTS,
  REMEMBERED_SESSION_TTL_MS,
  RESEND_COOLDOWN_MS,
  SESSION_TTL_MS,
  acceptGoogleClaims,
  describeUserAgent,
  isSixDigitCode,
  normalizeUfmEmail,
} from "../../domain/rules";
import type {
  Credential,
  Device,
  IdentityError,
  MailMessage,
  Role,
  Session,
  User,
} from "../../domain/types";
import type { ClientInfo, IdentityPort, SignedIn } from "../../ports/identity-port";

/** Fictitious people only. The `.demo` local part keeps them from colliding with real UFM addresses. */
export const MOCK_USERS: User[] = [
  {
    id: "u-ana",
    nombre: "Ana",
    apellido: "López",
    correo: "ana.lopez.demo@ufm.edu",
    rol: "estudiante",
  },
  {
    id: "u-jorge",
    nombre: "Jorge",
    apellido: "Castillo",
    correo: "jorge.castillo.demo@ufm.edu",
    rol: "maestro",
  },
  {
    id: "u-carlos",
    nombre: "Carlos",
    apellido: "Méndez",
    correo: "carlos.mendez.demo@ufm.edu",
    rol: "auxiliar",
  },
  {
    id: "u-rodrigo",
    nombre: "Rodrigo",
    apellido: "Ajú",
    correo: "rodrigo.aju.demo@ufm.edu",
    rol: "administrativo",
  },
];

const MOCK_GOOGLE_CLIENT_ID = "mock-client.apps.googleusercontent.com";

type PendingCode = { hash: string; expira: number; intentos: number; enviado: number };
type PendingLink = { correo: string; expira: number };

type State = {
  users: Map<string, User>;
  codes: Map<string, PendingCode>;
  links: Map<string, PendingLink>;
  devices: Map<string, Device>;
  sessions: Map<string, Session>;
  outbox: MailMessage[];
};

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const iso = (ms: number) => new Date(ms).toISOString();

function seed(now: number): State {
  const users = new Map(MOCK_USERS.map((u) => [u.id, { ...u }]));
  const devices = new Map<string, Device>();
  const sessions = new Map<string, Session>();
  // Two other devices where Ana is already signed in, so revoking has something to revoke.
  const others: Array<[string, string, string, Credential, number]> = [
    ["d-iphone", "iPhone de Ana", "Safari en iOS · Ciudad de Guatemala", "passkey", 2 * 864e5],
    [
      "d-lab",
      "Computadora del laboratorio D-210",
      "Chrome en Windows · Campus UFM",
      "sesion",
      8 * 864e5,
    ],
  ];
  for (const [id, nombre, navegadorLugar, credencial, haceMs] of others) {
    const [navegador = "", lugar = ""] = navegadorLugar.split(" · ");
    devices.set(id, {
      id,
      userId: "u-ana",
      nombre,
      navegador,
      lugar,
      credencial,
      ultimaVez: iso(now - haceMs),
      desde: iso(now - 40 * 864e5),
    });
    sessions.set(`s-${id}`, {
      id: `s-${id}`,
      userId: "u-ana",
      deviceId: id,
      creada: iso(now - haceMs),
      expira: iso(now + REMEMBERED_SESSION_TTL_MS),
    });
  }
  return { users, codes: new Map(), links: new Map(), devices, sessions, outbox: [] };
}

export class MockIdentity implements IdentityPort {
  private state: State;

  constructor(
    private readonly now: () => number = Date.now,
    private readonly baseUrl = "",
  ) {
    this.state = seed(now());
  }

  async startEmailSignIn(input: string) {
    const correo = normalizeUfmEmail(input);
    if (!correo) return fail("dominio");
    const now = this.now();
    const previo = this.state.codes.get(correo);
    if (previo && now - previo.enviado < RESEND_COOLDOWN_MS) {
      return fail("espera", iso(previo.enviado + RESEND_COOLDOWN_MS));
    }
    const codigo = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const token = randomBytes(24).toString("base64url");
    this.state.codes.set(correo, {
      hash: sha256(`${correo}:${codigo}`),
      expira: now + CODE_TTL_MS,
      intentos: 0,
      enviado: now,
    });
    this.state.links.set(sha256(token), { correo, expira: now + LINK_TTL_MS });
    this.state.outbox.unshift({
      para: correo,
      asunto: `Tu código de MiU es ${codigo}`,
      codigo,
      enlace: `${this.baseUrl}/login/enlace?token=${token}`,
      enviado: iso(now),
    });
    return ok({ expira: iso(now + CODE_TTL_MS), reenviarDesde: iso(now + RESEND_COOLDOWN_MS) });
  }

  async verifyCode(
    input: string,
    code: string,
    client: ClientInfo,
    recordar: boolean,
  ): Promise<Result<SignedIn, IdentityError>> {
    const correo = normalizeUfmEmail(input);
    const pendiente = correo ? this.state.codes.get(correo) : undefined;
    if (!correo || !pendiente) return fail("codigo_vencido");
    if (pendiente.intentos >= MAX_ATTEMPTS) return fail("bloqueado");
    if (this.now() > pendiente.expira) return fail("codigo_vencido");
    if (!isSixDigitCode(code) || sha256(`${correo}:${code}`) !== pendiente.hash) {
      pendiente.intentos += 1;
      return pendiente.intentos >= MAX_ATTEMPTS
        ? fail("bloqueado")
        : fail("codigo_incorrecto", String(MAX_ATTEMPTS - pendiente.intentos));
    }
    this.forgetPending(correo);
    return ok(this.openSession(correo, client, recordar, "sesion"));
  }

  async peekMagicLink(token: string) {
    const link = this.state.links.get(sha256(token));
    if (!link || this.now() > link.expira) return fail("enlace_invalido");
    return ok({ correo: link.correo });
  }

  async consumeMagicLink(
    token: string,
    client: ClientInfo,
    recordar: boolean,
  ): Promise<Result<SignedIn, IdentityError>> {
    const link = this.state.links.get(sha256(token));
    if (!link || this.now() > link.expira) return fail("enlace_invalido");
    this.forgetPending(link.correo);
    return ok(this.openSession(link.correo, client, recordar, "sesion"));
  }

  async signInWithGoogle(client: ClientInfo): Promise<Result<SignedIn, IdentityError>> {
    // Simulated ID token for the demo student. The same claim checks run in the real adapter.
    const claims = {
      iss: "https://accounts.google.com",
      aud: MOCK_GOOGLE_CLIENT_ID,
      exp: Math.floor(this.now() / 1000) + 300,
      email: "ana.lopez.demo@ufm.edu",
      email_verified: true,
      hd: "ufm.edu",
    };
    if (!acceptGoogleClaims(claims, MOCK_GOOGLE_CLIENT_ID, Math.floor(this.now() / 1000)))
      return fail("google_rechazado");
    return ok(this.openSession(claims.email, client, false, "sesion"));
  }

  async signInWithPasskey(
    deviceId: string | undefined,
    client: ClientInfo,
  ): Promise<Result<SignedIn, IdentityError>> {
    const device = deviceId ? this.state.devices.get(deviceId) : undefined;
    if (!device || device.credencial !== "passkey") return fail("sin_passkey");
    const user = this.state.users.get(device.userId);
    if (!user) return fail("sin_passkey");
    device.ultimaVez = iso(this.now());
    device.lugar = client.lugar;
    return ok({ user, session: this.createSession(user.id, device.id, true) });
  }

  async getSession(sessionId: string): Promise<Result<SignedIn, IdentityError>> {
    const session = this.state.sessions.get(sessionId);
    if (!session || this.now() > Date.parse(session.expira)) return fail("sesion_invalida");
    const user = this.state.users.get(session.userId);
    const device = this.state.devices.get(session.deviceId);
    if (!user || !device) return fail("sesion_invalida");
    device.ultimaVez = iso(this.now());
    return ok({ session, user });
  }

  async signOut(sessionId: string) {
    this.state.sessions.delete(sessionId);
  }

  async listDevices(userId: string) {
    return [...this.state.devices.values()]
      .filter((d) => d.userId === userId)
      .sort((a, b) => Date.parse(b.ultimaVez) - Date.parse(a.ultimaVez));
  }

  async revokeDevice(
    userId: string,
    deviceId: string,
  ): Promise<Result<{ sesionesCerradas: number }, IdentityError>> {
    const device = this.state.devices.get(deviceId);
    if (!device || device.userId !== userId) return fail("no_encontrado");
    let sesionesCerradas = 0;
    for (const [id, s] of this.state.sessions) {
      if (s.deviceId === deviceId) {
        this.state.sessions.delete(id);
        sesionesCerradas += 1;
      }
    }
    this.state.devices.delete(deviceId);
    return ok({ sesionesCerradas });
  }

  async registerPasskey(userId: string, deviceId: string): Promise<Result<Device, IdentityError>> {
    const device = this.state.devices.get(deviceId);
    if (!device || device.userId !== userId) return fail("no_encontrado");
    device.credencial = "passkey";
    return ok(device);
  }

  async setActiveRole(sessionId: string, role: Role): Promise<Result<Session, IdentityError>> {
    const session = this.state.sessions.get(sessionId);
    if (!session) return fail("sesion_invalida");
    session.rolActivo = role;
    return ok(session);
  }

  async outbox() {
    return [...this.state.outbox];
  }

  private forgetPending(correo: string) {
    this.state.codes.delete(correo);
    for (const [hash, link] of this.state.links)
      if (link.correo === correo) this.state.links.delete(hash);
  }

  private openSession(
    correo: string,
    client: ClientInfo,
    recordar: boolean,
    credencial: Credential,
  ): SignedIn {
    let user = [...this.state.users.values()].find((u) => u.correo === correo);
    if (!user) {
      // Proving ownership of an @ufm.edu address is enough to create a student account.
      const [local = "usuario"] = correo.split("@");
      const [nombre = local, apellido = ""] = local
        .split(".")
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1));
      user = { id: `u-${randomUUID()}`, nombre, apellido, correo, rol: "estudiante" };
      this.state.users.set(user.id, user);
    }
    const now = iso(this.now());
    const device: Device = {
      id: `d-${randomUUID()}`,
      userId: user.id,
      nombre: describeUserAgent(client.userAgent),
      navegador: describeUserAgent(client.userAgent),
      lugar: client.lugar,
      credencial,
      ultimaVez: now,
      desde: now,
    };
    this.state.devices.set(device.id, device);
    return { user, session: this.createSession(user.id, device.id, recordar) };
  }

  private createSession(userId: string, deviceId: string, recordar: boolean): Session {
    const now = this.now();
    const session: Session = {
      id: randomBytes(32).toString("base64url"),
      userId,
      deviceId,
      creada: iso(now),
      expira: iso(now + (recordar ? REMEMBERED_SESSION_TTL_MS : SESSION_TTL_MS)),
    };
    this.state.sessions.set(session.id, session);
    return session;
  }
}
