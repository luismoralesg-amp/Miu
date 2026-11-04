import { beforeEach, describe, expect, it } from "vitest";

import { MockIdentity } from "./adapters/mock/mock-identity";
import {
  CODE_TTL_MS,
  MAX_ATTEMPTS,
  RESEND_COOLDOWN_MS,
  SESSION_TTL_MS,
  acceptGoogleClaims,
  describeUserAgent,
  maskEmail,
  normalizeUfmEmail,
} from "./domain/rules";

const client = {
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0) Chrome/140.0",
  lugar: "Ciudad de Guatemala",
};

describe("rules", () => {
  it("accepts only the exact ufm.edu domain", () => {
    expect(normalizeUfmEmail("  Ana.Lopez.Demo@UFM.edu ")).toBe("ana.lopez.demo@ufm.edu");
    for (const bad of [
      "ana@gmail.com",
      "ana@alumnos.ufm.edu",
      "ana@ufm.edu.gt",
      "ana@ufm-edu.com",
      "@ufm.edu",
      "ana@@ufm.edu",
    ]) {
      expect(normalizeUfmEmail(bad)).toBeNull();
    }
  });

  it("masks the address without hiding the domain", () => {
    expect(maskEmail("ana.lopez@ufm.edu")).toBe("a••••••••@ufm.edu");
  });

  it("checks Google claims on the server, not just the hd hint", () => {
    const base = {
      iss: "https://accounts.google.com",
      aud: "c",
      exp: 200,
      email: "ana.demo@ufm.edu",
      email_verified: true,
      hd: "ufm.edu",
    };
    expect(acceptGoogleClaims(base, "c", 100)).toBe(true);
    expect(acceptGoogleClaims({ ...base, hd: "gmail.com" }, "c", 100)).toBe(false);
    expect(acceptGoogleClaims({ ...base, email_verified: false }, "c", 100)).toBe(false);
    expect(acceptGoogleClaims({ ...base, aud: "other" }, "c", 100)).toBe(false);
    expect(acceptGoogleClaims({ ...base, exp: 50 }, "c", 100)).toBe(false);
    expect(acceptGoogleClaims({ ...base, email: "ana@gmail.com" }, "c", 100)).toBe(false);
  });

  it("describes devices in plain Spanish", () => {
    expect(describeUserAgent(client.userAgent)).toBe("Chrome en macOS");
    expect(
      describeUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 19_0) Version/19.0 Safari/605.1"),
    ).toBe("Safari en iOS");
  });
});

describe("MockIdentity", () => {
  let now: number;
  let id: MockIdentity;
  const lastCode = async () => (await id.outbox())[0]!.codigo;

  beforeEach(() => {
    now = Date.parse("2026-10-22T13:42:00Z");
    id = new MockIdentity(() => now);
  });

  it("rejects addresses outside @ufm.edu before sending anything", async () => {
    expect(await id.startEmailSignIn("ana@gmail.com")).toEqual({ ok: false, error: "dominio" });
    expect(await id.outbox()).toHaveLength(0);
  });

  it("signs in with the 6-digit code, once", async () => {
    await id.startEmailSignIn("ana.lopez.demo@ufm.edu");
    const code = await lastCode();
    expect(code).toMatch(/^\d{6}$/);
    const signed = await id.verifyCode("ana.lopez.demo@ufm.edu", code, client, false);
    expect(signed.ok && signed.value.user.nombre).toBe("Ana");
    expect((await id.verifyCode("ana.lopez.demo@ufm.edu", code, client, false)).ok).toBe(false);
  });

  it("locks after five wrong codes and reports what is left", async () => {
    await id.startEmailSignIn("ana.lopez.demo@ufm.edu");
    const first = await id.verifyCode("ana.lopez.demo@ufm.edu", "000000", client, false);
    expect(first).toMatchObject({
      ok: false,
      error: "codigo_incorrecto",
      detail: String(MAX_ATTEMPTS - 1),
    });
    for (let i = 1; i < MAX_ATTEMPTS - 1; i++)
      await id.verifyCode("ana.lopez.demo@ufm.edu", "000000", client, false);
    expect(await id.verifyCode("ana.lopez.demo@ufm.edu", "000000", client, false)).toMatchObject({
      error: "bloqueado",
    });
    expect(
      await id.verifyCode("ana.lopez.demo@ufm.edu", await lastCode(), client, false),
    ).toMatchObject({ error: "bloqueado" });
  });

  it("expires codes after 10 minutes and throttles resends", async () => {
    await id.startEmailSignIn("ana.lopez.demo@ufm.edu");
    expect(await id.startEmailSignIn("ana.lopez.demo@ufm.edu")).toMatchObject({
      ok: false,
      error: "espera",
    });
    const code = await lastCode();
    now += CODE_TTL_MS + 1;
    expect(await id.verifyCode("ana.lopez.demo@ufm.edu", code, client, false)).toMatchObject({
      error: "codigo_vencido",
    });
    now += RESEND_COOLDOWN_MS;
    expect((await id.startEmailSignIn("ana.lopez.demo@ufm.edu")).ok).toBe(true);
  });

  it("consumes a magic link a single time", async () => {
    await id.startEmailSignIn("ana.lopez.demo@ufm.edu");
    const token = new URL((await id.outbox())[0]!.enlace, "http://x").searchParams.get("token")!;
    expect(await id.peekMagicLink(token)).toEqual({
      ok: true,
      value: { correo: "ana.lopez.demo@ufm.edu" },
    });
    expect((await id.consumeMagicLink(token, client, true)).ok).toBe(true);
    expect(await id.consumeMagicLink(token, client, true)).toMatchObject({
      error: "enlace_invalido",
    });
  });

  it("revokes a device and every session on it, but only for its owner", async () => {
    await id.startEmailSignIn("ana.lopez.demo@ufm.edu");
    const signed = await id.verifyCode("ana.lopez.demo@ufm.edu", await lastCode(), client, false);
    if (!signed.ok) throw new Error("sign in failed");
    const devices = await id.listDevices("u-ana");
    expect(devices.map((d) => d.nombre)).toContain("iPhone de Ana");
    expect(await id.revokeDevice("u-jorge", "d-lab")).toMatchObject({ error: "no_encontrado" });
    expect(await id.revokeDevice("u-ana", "d-lab")).toEqual({
      ok: true,
      value: { sesionesCerradas: 1 },
    });
    expect((await id.listDevices("u-ana")).some((d) => d.id === "d-lab")).toBe(false);
    expect((await id.getSession(signed.value.session.id)).ok).toBe(true);
  });

  it("signs in with a passkey only on a device that registered one", async () => {
    expect(await id.signInWithPasskey(undefined, client)).toMatchObject({ error: "sin_passkey" });
    expect(await id.signInWithPasskey("d-lab", client)).toMatchObject({ error: "sin_passkey" });
    expect((await id.signInWithPasskey("d-iphone", client)).ok).toBe(true);
  });

  it("accepts the simulated Google account only after the claim checks", async () => {
    const signed = await id.signInWithGoogle(client);
    expect(signed.ok && signed.value.user.correo).toBe("ana.lopez.demo@ufm.edu");
  });

  it("reuses this browser's device when signing in again", async () => {
    await id.startEmailSignIn("ana.lopez.demo@ufm.edu");
    const first = await id.verifyCode("ana.lopez.demo@ufm.edu", await lastCode(), client, false);
    if (!first.ok) throw new Error("sign in failed");
    now += 60_000;
    await id.startEmailSignIn("ana.lopez.demo@ufm.edu");
    const again = await id.verifyCode(
      "ana.lopez.demo@ufm.edu",
      await lastCode(),
      { ...client, deviceId: first.value.session.deviceId },
      false,
    );
    expect(again.ok && again.value.session.deviceId).toBe(first.value.session.deviceId);
    expect(await id.listDevices("u-ana")).toHaveLength(3);
  });
});

/** Serverless: each request may land on a new instance, so a second `MockIdentity` stands for it. */
describe("MockIdentity across server instances", () => {
  const now = () => Date.parse("2026-10-22T13:42:00Z");
  const correo = "ana.lopez.demo@ufm.edu";

  it("a session opened on one instance is valid on another, with the same user and role", async () => {
    const a = new MockIdentity(now);
    await a.startEmailSignIn(correo);
    const code = (await a.outbox())[0]!.codigo;
    const signed = await a.verifyCode(correo, code, client, false);
    if (!signed.ok) throw new Error("sign-in failed");

    const b = new MockIdentity(now);
    const seen = await b.getSession(signed.value.session.id);
    expect(seen).toMatchObject({ ok: true, value: { user: { id: "u-ana", correo } } });
    // The device of that session is known to the new instance too.
    expect((await b.listDevices("u-ana")).some((d) => d.id === signed.value.session.deviceId)).toBe(
      true,
    );

    const switched = await b.setActiveRole(signed.value.session.id, "maestro");
    if (!switched.ok) throw new Error("role switch failed");
    const c = new MockIdentity(now);
    expect(await c.getSession(switched.value.id)).toMatchObject({
      ok: true,
      value: { session: { rolActivo: "maestro" } },
    });
    // The old cookie keeps the old role: the role is in the cookie, not in any memory.
    expect((await c.getSession(signed.value.session.id)) as object).not.toMatchObject({
      value: { session: { rolActivo: "maestro" } },
    });
  });

  it("refuses a forged, tampered, expired or foreign cookie", async () => {
    const a = new MockIdentity(now);
    await a.startEmailSignIn(correo);
    const signed = await a.verifyCode(correo, (await a.outbox())[0]!.codigo, client, false);
    if (!signed.ok) throw new Error("sign-in failed");
    const [body, sig] = signed.value.session.id.split(".");
    const claims = JSON.parse(Buffer.from(body!, "base64url").toString());
    const forged = Buffer.from(
      JSON.stringify({ ...claims, uid: "u-rodrigo", c: "rodrigo.aju.demo@ufm.edu" }),
    ).toString("base64url");
    const b = new MockIdentity(now);
    for (const bad of [`${forged}.${sig}`, "nada", `${body}.AAAA`, "x.y.z"])
      expect(await b.getSession(bad)).toMatchObject({ ok: false, error: "sesion_invalida" });
    const later = new MockIdentity(() => now() + SESSION_TTL_MS + 1);
    expect(await later.getSession(signed.value.session.id)).toMatchObject({ ok: false });
  });

  it("a code and a magic link sent by one instance work on another, once each", async () => {
    const a = new MockIdentity(now);
    await a.startEmailSignIn(correo);
    const sent = (await a.outbox())[0]!;
    const token = new URL(sent.enlace, "http://x").searchParams.get("token")!;

    const b = new MockIdentity(now);
    // The page shows what was sent even though this instance never sent it.
    expect((await b.outbox(correo))[0]).toMatchObject({ codigo: sent.codigo });
    expect((await b.verifyCode(correo, sent.codigo, client, false)).ok).toBe(true);
    expect(await b.verifyCode(correo, sent.codigo, client, false)).toMatchObject({ ok: false });
    expect(await b.verifyCode(correo, "000000", client, false)).toMatchObject({ ok: false });

    const c = new MockIdentity(now);
    expect(await c.peekMagicLink(token)).toMatchObject({ ok: true, value: { correo } });
    expect((await c.consumeMagicLink(token, client, false)).ok).toBe(true);
    expect(await c.consumeMagicLink(token, client, false)).toMatchObject({ ok: false });
    expect(await c.peekMagicLink("no-es-un-enlace")).toMatchObject({ ok: false });
  });

  it("locks a derived code after five wrong tries, and ends a signed-out session on that instance", async () => {
    const b = new MockIdentity(now);
    for (let i = 0; i < MAX_ATTEMPTS - 1; i++) await b.verifyCode(correo, "000000", client, false);
    expect(await b.verifyCode(correo, "000000", client, false)).toMatchObject({
      error: "bloqueado",
    });

    const a = new MockIdentity(now);
    await a.startEmailSignIn("ana.nueva@ufm.edu");
    const signed = await a.verifyCode(
      "ana.nueva@ufm.edu",
      (await a.outbox())[0]!.codigo,
      client,
      false,
    );
    if (!signed.ok) throw new Error("sign-in failed");
    // A new address becomes the same student every time, on any instance.
    const again = new MockIdentity(now);
    await again.startEmailSignIn("ana.nueva@ufm.edu");
    const second = await again.verifyCode(
      "ana.nueva@ufm.edu",
      (await again.outbox())[0]!.codigo,
      client,
      false,
    );
    expect(second.ok && second.value.user.id).toBe(signed.value.user.id);
    await a.signOut(signed.value.session.id);
    expect(await a.getSession(signed.value.session.id)).toMatchObject({ ok: false });
  });
});
