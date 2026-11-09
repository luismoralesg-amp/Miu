import { createHash, randomBytes, randomUUID } from "node:crypto";

import { acceptsDemoCode, demoCode, signToken, verifyToken } from "@/lib/demo-token";
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
  type GoogleClaims,
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
    id: "u-sofia",
    nombre: "Sofía",
    apellido: "Ramírez",
    correo: "sofia.ramirez.demo@ufm.edu",
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
  /** Best effort, per instance: what a stateless check cannot know (used, revoked, failed tries). */
  used: Set<string>;
  revokedSessions: Set<string>;
  revokedDevices: Set<string>;
  attempts: Map<string, number>;
};

/** What a session cookie carries, so any instance can rebuild the session without a shared store. */
type SessionClaims = {
  k: "s";
  sid: string;
  uid: string;
  c: string;
  did: string;
  dn: Pick<Device, "nombre" | "navegador" | "lugar" | "credencial" | "desde">;
  cre: string;
  exp: string;
  rol?: Role;
};
type LinkClaims = { k: "l"; c: string; exp: number };

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
  return {
    users,
    codes: new Map(),
    links: new Map(),
    devices,
    sessions,
    outbox: [],
    used: new Set(),
    revokedSessions: new Set(),
    revokedDevices: new Set(),
    attempts: new Map(),
  };
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
    // Derived, not random: any instance can compute it again (see src/lib/demo-token.ts).
    const codigo = demoCode("login", correo, Math.floor(now / CODE_TTL_MS));
    const token = this.linkToken(correo, now);
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
    if (!correo) return fail("codigo_vencido");
    const pendiente = this.state.codes.get(correo);
    // Not asked on this instance (serverless: another one sent it): check the derived code instead.
    if (!pendiente) return this.verifyDerivedCode(correo, code, client, recordar);
    if (pendiente.intentos >= MAX_ATTEMPTS) return fail("bloqueado");
    if (this.now() > pendiente.expira) return fail("codigo_vencido");
    if (!isSixDigitCode(code) || sha256(`${correo}:${code}`) !== pendiente.hash) {
      pendiente.intentos += 1;
      return pendiente.intentos >= MAX_ATTEMPTS
        ? fail("bloqueado")
        : fail("codigo_incorrecto", String(MAX_ATTEMPTS - pendiente.intentos));
    }
    this.forgetPending(correo);
    this.state.used.add(sha256(`${correo}:${code}`));
    return ok(this.openSession(correo, client, recordar, "sesion"));
  }

  /** The address a still-valid, unused link was issued for. */
  private linkOwner(token: string): string | null {
    if (this.state.used.has(sha256(token))) return null;
    const claims = verifyToken<LinkClaims>(token);
    if (!claims || claims.k !== "l" || this.now() > claims.exp) return null;
    return claims.c;
  }

  async peekMagicLink(token: string) {
    const correo = this.linkOwner(token);
    if (!correo) return fail("enlace_invalido");
    return ok({ correo });
  }

  async consumeMagicLink(
    token: string,
    client: ClientInfo,
    recordar: boolean,
  ): Promise<Result<SignedIn, IdentityError>> {
    const correo = this.linkOwner(token);
    if (!correo) return fail("enlace_invalido");
    this.state.used.add(sha256(token));
    this.forgetPending(correo);
    return ok(this.openSession(correo, client, recordar, "sesion"));
  }

  async signInWithGoogle(
    client: ClientInfo,
    verified?: GoogleClaims,
  ): Promise<Result<SignedIn, IdentityError>> {
    // With `verified` the ID token is real and was checked by the caller; the claim rules run again
    // here on purpose (the adapter must not trust that a caller did). Without it: the demo student.
    const claims = verified ?? {
      iss: "https://accounts.google.com",
      aud: MOCK_GOOGLE_CLIENT_ID,
      exp: Math.floor(this.now() / 1000) + 300,
      email: "ana.lopez.demo@ufm.edu",
      email_verified: true,
      hd: "ufm.edu",
    };
    const clientId = verified
      ? (process.env.GOOGLE_CLIENT_ID?.trim() ?? "")
      : MOCK_GOOGLE_CLIENT_ID;
    if (!clientId || !acceptGoogleClaims(claims, clientId, Math.floor(this.now() / 1000)))
      return fail("google_rechazado");
    return ok(this.openSession(claims.email.toLowerCase(), client, false, "sesion"));
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
    const claims = verifyToken<SessionClaims>(sessionId);
    if (!claims || claims.k !== "s") return fail("sesion_invalida");
    if (this.state.revokedSessions.has(claims.sid) || this.state.revokedDevices.has(claims.did))
      return fail("sesion_invalida");
    if (this.now() > Date.parse(claims.exp)) return fail("sesion_invalida");
    const { user, device, session } = this.rehydrate(sessionId, claims);
    device.ultimaVez = iso(this.now());
    return ok({ session, user });
  }

  /** Rebuilds user, device and session from the cookie when this instance has never seen them. */
  private rehydrate(token: string, c: SessionClaims) {
    let user = this.state.users.get(c.uid);
    if (!user) {
      user = this.userFor(c.c, c.uid);
      this.state.users.set(user.id, user);
    }
    let device = this.state.devices.get(c.did);
    if (!device) {
      device = { id: c.did, userId: c.uid, ...c.dn, ultimaVez: iso(this.now()) };
      this.state.devices.set(device.id, device);
    }
    let session = this.state.sessions.get(token);
    if (!session) {
      session = {
        id: token,
        userId: c.uid,
        deviceId: c.did,
        creada: c.cre,
        expira: c.exp,
        ...(c.rol ? { rolActivo: c.rol } : {}),
      };
      this.state.sessions.set(token, session);
    }
    return { user, device, session };
  }

  async signOut(sessionId: string) {
    const claims = verifyToken<SessionClaims>(sessionId);
    if (claims) this.state.revokedSessions.add(claims.sid);
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
    this.state.revokedDevices.add(deviceId);
    return ok({ sesionesCerradas });
  }

  async registerPasskey(userId: string, deviceId: string): Promise<Result<Device, IdentityError>> {
    const device = this.state.devices.get(deviceId);
    if (!device || device.userId !== userId) return fail("no_encontrado");
    device.credencial = "passkey";
    return ok(device);
  }

  /** The role lives in the cookie: the answer carries the new session id, which the caller stores. */
  async setActiveRole(sessionId: string, role: Role): Promise<Result<Session, IdentityError>> {
    const claims = verifyToken<SessionClaims>(sessionId);
    const current = await this.getSession(sessionId);
    if (!claims || !current.ok) return fail("sesion_invalida");
    const token = signToken({ ...claims, rol: role } satisfies SessionClaims);
    this.state.sessions.delete(sessionId);
    const session: Session = { ...current.value.session, id: token, rolActivo: role };
    this.state.sessions.set(token, session);
    return ok(session);
  }

  async outbox(correo?: string) {
    const sent = [...this.state.outbox];
    // Another instance may have sent it: the code and link are derivable, so show them anyway.
    const owner = correo ? normalizeUfmEmail(correo) : null;
    if (owner && !sent.some((m) => m.para === owner)) {
      const now = this.now();
      const codigo = demoCode("login", owner, Math.floor(now / CODE_TTL_MS));
      sent.unshift({
        para: owner,
        asunto: `Tu código de MiU es ${codigo}`,
        codigo,
        enlace: `${this.baseUrl}/login/enlace?token=${this.linkToken(owner, now)}`,
        enviado: iso(now),
      });
    }
    return sent;
  }

  private linkToken(correo: string, now: number) {
    return signToken({ k: "l", c: correo, exp: now + LINK_TTL_MS } satisfies LinkClaims);
  }

  private verifyDerivedCode(
    correo: string,
    code: string,
    client: ClientInfo,
    recordar: boolean,
  ): Result<SignedIn, IdentityError> {
    if ((this.state.attempts.get(correo) ?? 0) >= MAX_ATTEMPTS) return fail("bloqueado");
    const key = sha256(`${correo}:${code}`);
    if (this.state.used.has(key)) return fail("codigo_vencido");
    if (!isSixDigitCode(code) || !acceptsDemoCode("login", correo, code, this.now(), CODE_TTL_MS)) {
      const tries = (this.state.attempts.get(correo) ?? 0) + 1;
      this.state.attempts.set(correo, tries);
      return tries >= MAX_ATTEMPTS
        ? fail("bloqueado")
        : fail("codigo_incorrecto", String(MAX_ATTEMPTS - tries));
    }
    this.state.used.add(key);
    this.state.attempts.delete(correo);
    return ok(this.openSession(correo, client, recordar, "sesion"));
  }

  /** Same address, same id: a person keeps their workspace across sign-ins and across instances. */
  private userFor(correo: string, id?: string): User {
    const known = MOCK_USERS.find((u) => u.correo === correo);
    if (known) return { ...known };
    const [local = "usuario"] = correo.split("@");
    const [nombre = local, apellido = ""] = local
      .split(".")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1));
    return {
      id: id ?? `u-${sha256(correo).slice(0, 16)}`,
      nombre,
      apellido,
      correo,
      rol: "estudiante",
    };
  }

  private forgetPending(correo: string) {
    this.state.codes.delete(correo);
    for (const [hash, link] of this.state.links)
      if (link.correo === correo) {
        this.state.links.delete(hash);
        this.state.used.add(hash);
      }
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
      user = this.userFor(correo);
      this.state.users.set(user.id, user);
    }
    const now = iso(this.now());
    const known = client.deviceId ? this.state.devices.get(client.deviceId) : undefined;
    const device: Device =
      known && known.userId === user.id
        ? Object.assign(known, { ultimaVez: now, lugar: client.lugar })
        : {
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
    const user = this.state.users.get(userId)!;
    const device = this.state.devices.get(deviceId)!;
    const creada = iso(now);
    const expira = iso(now + (recordar ? REMEMBERED_SESSION_TTL_MS : SESSION_TTL_MS));
    const claims: SessionClaims = {
      k: "s",
      sid: randomBytes(16).toString("base64url"),
      uid: userId,
      c: user.correo,
      did: deviceId,
      dn: {
        nombre: device.nombre,
        navegador: device.navegador,
        lugar: device.lugar,
        credencial: device.credencial,
        desde: device.desde,
      },
      cre: creada,
      exp: expira,
    };
    const session: Session = {
      id: signToken(claims),
      userId,
      deviceId,
      creada,
      expira,
    };
    this.state.sessions.set(session.id, session);
    return session;
  }
}
