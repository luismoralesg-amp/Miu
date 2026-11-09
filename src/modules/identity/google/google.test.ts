// @vitest-environment node
import { createHash, generateKeyPairSync, sign } from "node:crypto";

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetAdapters } from "@/lib/adapters";
import { signToken } from "@/lib/demo-token";

import { MockIdentity } from "../adapters/mock/mock-identity";
import {
  GOOGLE_AUTH_URL,
  GOOGLE_JWKS_URL,
  GOOGLE_TOKEN_URL,
  authorizationUrl,
  verifyIdToken,
} from "./oidc";
import {
  GOOGLE_STATE_COOKIE,
  beginGoogleSignIn,
  finishGoogleSignIn,
  forgetWarnings,
  googleMode,
  requestOrigin,
  warnMockGoogle,
} from "./signin";

const started = vi.hoisted(() => ({ sessions: [] as unknown[] }));
vi.mock("@/modules/identity/session", () => ({
  clientInfo: async () => ({ userAgent: "Chrome/1 Macintosh", lugar: "Ciudad de Guatemala" }),
  startSession: async (signed: unknown) => void started.sessions.push(signed),
}));

/**
 * Google, answered in place by a fake that speaks its HTTP: the authorization endpoint is only a URL
 * the test reads, the token endpoint checks the PKCE verifier and the client secret, and the key set
 * carries the public half of a key generated here, so the ID tokens are really signed (RS256).
 */
const ORIGIN = "https://miu-2026.vercel.app";
const CLIENT_ID = "1234.apps.googleusercontent.com";
const SECRET = "GOCSPX-test-secret";
const REDIRECT = `${ORIGIN}/login/google/callback`;
const CREDENTIALS = { GOOGLE_CLIENT_ID: CLIENT_ID, GOOGLE_CLIENT_SECRET: SECRET };
const ENV = { ...CREDENTIALS, GOOGLE_REDIRECT_URI: REDIRECT };
const NOW = Date.parse("2026-11-08T12:00:00Z");

const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const other = generateKeyPairSync("rsa", { modulusLength: 2048 });
const JWKS = { keys: [{ ...publicKey.export({ format: "jwk" }), kid: "k1", alg: "RS256" }] };

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");

function idToken(
  claims: Record<string, unknown>,
  { key = privateKey, header = {} as Record<string, unknown> } = {},
) {
  const h = b64({ alg: "RS256", kid: "k1", ...header });
  const p = b64(claims);
  const sig = sign("RSA-SHA256", Buffer.from(`${h}.${p}`), key).toString("base64url");
  return `${h}.${p}.${sig}`;
}

const good = (nonce: string, over: Record<string, unknown> = {}) => ({
  iss: "https://accounts.google.com",
  aud: CLIENT_ID,
  exp: Math.floor(NOW / 1000) + 600,
  email: "maria.perez@ufm.edu",
  email_verified: true,
  hd: "ufm.edu",
  nonce,
  ...over,
});

type Fake = {
  /** What the token endpoint hands out for the next valid exchange. */
  token: (nonce: string) => string;
  tokenStatus?: number;
  jwksStatus?: number;
  down?: boolean;
  calls: string[];
};

/** A `fetch` that is Google. Records every call; refuses a wrong secret, code or verifier. */
function fakeGoogle(f: Fake, want: { challenge: string; nonce: string }): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    f.calls.push(url);
    if (f.down) throw new TypeError("fetch failed");
    if (url === GOOGLE_JWKS_URL) return Response.json(JWKS, { status: f.jwksStatus ?? 200 });
    if (url === GOOGLE_TOKEN_URL) {
      const body = new URLSearchParams(String(init?.body));
      const challenge = createHash("sha256")
        .update(body.get("code_verifier") ?? "")
        .digest("base64url");
      const valid =
        body.get("grant_type") === "authorization_code" &&
        body.get("client_id") === CLIENT_ID &&
        body.get("client_secret") === SECRET &&
        body.get("code") === "code-1" &&
        challenge === want.challenge;
      if (!valid) return Response.json({ error: "invalid_grant" }, { status: 400 });
      if (f.tokenStatus) return Response.json({}, { status: f.tokenStatus });
      return Response.json({ id_token: f.token(want.nonce) });
    }
    return new Response("not found", { status: 404 });
  }) as typeof fetch;
}

/** Starts a sign-in and returns what Google would be told, and the browser's cookie. */
function start(env: Record<string, string> = ENV) {
  const begun = beginGoogleSignIn(ORIGIN, { env, now: () => NOW });
  if (begun.mode !== "real") throw new Error("expected the real flow");
  const q = new URL(begun.url).searchParams;
  return {
    begun,
    cookie: begun.cookie,
    state: q.get("state")!,
    nonce: q.get("nonce")!,
    challenge: q.get("code_challenge")!,
    query: q,
  };
}

function setup(over: Partial<Fake> = {}) {
  const s = start();
  const fake: Fake = { token: (n) => idToken(good(n)), calls: [], ...over };
  const fetch = fakeGoogle(fake, { challenge: s.challenge, nonce: s.nonce });
  const finish = (
    back: Partial<{ code: string | null; state: string | null; error: string | null }> = {},
    cookie: string | null = s.cookie,
    now = NOW,
  ) =>
    finishGoogleSignIn(
      { code: "code-1", state: s.state, error: null, ...back },
      cookie ?? undefined,
      ORIGIN,
      { env: ENV, fetch, now: () => now },
    );
  return { s, fake, fetch, finish };
}

describe("which Google the demo uses", () => {
  it("real only with both credentials; otherwise the mock, with the reason", () => {
    expect(googleMode(ORIGIN, {})).toMatchObject({ mode: "mock" });
    expect(googleMode(ORIGIN, { GOOGLE_CLIENT_ID: CLIENT_ID })).toMatchObject({ mode: "mock" });
    expect(googleMode(ORIGIN, { GOOGLE_CLIENT_SECRET: SECRET })).toMatchObject({ mode: "mock" });
    expect(googleMode(ORIGIN, { GOOGLE_CLIENT_ID: " ", GOOGLE_CLIENT_SECRET: " " })).toMatchObject({
      mode: "mock",
    });
    // Localhost is the one host whose redirect URI can be worked out from the request.
    expect(googleMode("http://localhost:3000", CREDENTIALS)).toEqual({
      mode: "real",
      config: {
        clientId: CLIENT_ID,
        clientSecret: SECRET,
        redirectUri: "http://localhost:3000/login/google/callback",
      },
    });
    expect(googleMode(ORIGIN, ENV)).toEqual({
      mode: "real",
      config: { clientId: CLIENT_ID, clientSecret: SECRET, redirectUri: REDIRECT },
    });
  });

  it("anywhere but localhost the redirect URI must be set, or it falls back (no Google error page)", () => {
    expect(googleMode(ORIGIN, CREDENTIALS)).toMatchObject({
      mode: "mock",
      reason: expect.stringContaining("GOOGLE_REDIRECT_URI"),
    });
  });

  it("a host that is not the registered redirect falls back, so a preview never ends on Google's error", () => {
    const env = ENV;
    expect(googleMode(ORIGIN, env)).toMatchObject({ mode: "real" });
    expect(googleMode("https://miu-git-fix-abc.vercel.app", env)).toMatchObject({
      mode: "mock",
      reason: expect.stringContaining(ORIGIN),
    });
    expect(googleMode(ORIGIN, { ...ENV, GOOGLE_REDIRECT_URI: "no es url" })).toMatchObject({
      mode: "mock",
    });
  });

  it("MIU_GOOGLE_MODE=mock forces the simulated account even with credentials", () => {
    expect(googleMode(ORIGIN, { ...ENV, MIU_GOOGLE_MODE: "mock" })).toMatchObject({
      mode: "mock",
    });
  });

  it("reads the public origin behind a proxy", () => {
    const h = (o: Record<string, string>) => new Headers(o);
    expect(
      requestOrigin(
        h({ "x-forwarded-host": "miu-2026.vercel.app", "x-forwarded-proto": "https" }),
        "x",
      ),
    ).toBe(ORIGIN);
    expect(requestOrigin(h({ host: "localhost:3000" }), "x")).toBe("http://localhost:3000");
    expect(requestOrigin(h({ host: "miu-2026.vercel.app" }), "x")).toBe(ORIGIN);
    expect(requestOrigin(h({}), "http://fallback")).toBe("http://fallback");
  });

  it("logs why it is simulating, once per reason", () => {
    forgetWarnings();
    const log = vi.fn();
    warnMockGoogle("faltan GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET", log);
    warnMockGoogle("faltan GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET", log);
    warnMockGoogle("MIU_GOOGLE_MODE=mock", log);
    expect(log).toHaveBeenCalledTimes(2);
    expect(log.mock.calls[0]![0]).toContain("[google]");
  });
});

describe("step 1: sending the browser to Google", () => {
  it("asks for the least: openid and email, PKCE S256, state, nonce, and the ufm.edu hint", () => {
    const { begun, query } = start();
    expect(begun.url.startsWith(`${GOOGLE_AUTH_URL}?`)).toBe(true);
    expect(Object.fromEntries(query)).toMatchObject({
      client_id: CLIENT_ID,
      redirect_uri: `${ORIGIN}/login/google/callback`,
      response_type: "code",
      scope: "openid email",
      code_challenge_method: "S256",
      hd: "ufm.edu",
    });
    expect(query.get("state")!.length).toBeGreaterThan(20);
    expect(query.get("nonce")!.length).toBeGreaterThan(20);
    // The secret and the verifier stay on the server and in the signed cookie.
    expect(begun.url).not.toContain(SECRET);
  });

  it("two sign-ins never share state, nonce or challenge", () => {
    const a = start();
    const b = start();
    expect(a.state).not.toBe(b.state);
    expect(a.nonce).not.toBe(b.nonce);
    expect(a.challenge).not.toBe(b.challenge);
  });

  it("without credentials it does not build a Google address at all", () => {
    expect(beginGoogleSignIn(ORIGIN, { env: {} })).toMatchObject({ mode: "mock" });
    expect(
      authorizationUrl(
        { clientId: "a", clientSecret: "b", redirectUri: "https://x/cb" },
        { state: "s", nonce: "n", challenge: "c" },
      ),
    ).toContain("accounts.google.com");
  });
});

describe("step 2: what Google sends back (real path, Google answered over HTTP)", () => {
  it("trades the code and accepts a verified @ufm.edu account", async () => {
    const { finish, fake } = setup();
    const result = await finish();
    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({ email: "maria.perez@ufm.edu", hd: "ufm.edu" }),
    });
    expect(fake.calls).toEqual([GOOGLE_TOKEN_URL, GOOGLE_JWKS_URL]);
  });

  it("refuses a browser that did not start this sign-in, or whose cookie was forged or expired", async () => {
    const { s, finish, fake } = setup();
    expect(await finish({ state: "otro" })).toMatchObject({ error: "google_rechazado" });
    expect(await finish({}, null)).toMatchObject({ error: "google_rechazado" });
    expect(await finish({}, `${s.cookie}x`)).toMatchObject({ error: "google_rechazado" });
    expect(await finish({}, signToken({ k: "g", s: s.state }))).toMatchObject({
      error: "google_rechazado",
    });
    expect(await finish({}, s.cookie, NOW + 11 * 60_000)).toMatchObject({
      error: "google_rechazado",
    });
    // None of those reached Google.
    expect(fake.calls).toEqual([]);
  });

  it("a person who cancels on Google's screen comes back as a refusal", async () => {
    const { finish, fake } = setup();
    expect(await finish({ error: "access_denied", code: null })).toMatchObject({
      error: "google_rechazado",
    });
    expect(await finish({ code: null })).toMatchObject({ error: "google_rechazado" });
    expect(fake.calls).toEqual([]);
  });

  it("a code that was used or does not match the PKCE verifier is refused", async () => {
    const { finish } = setup();
    expect(await finish({ code: "code-usado" })).toMatchObject({
      error: "google_rechazado",
      detail: "token 400",
    });
  });

  it.each([
    ["not an @ufm.edu Workspace account (no hd)", { hd: undefined, email: "ana@gmail.com" }],
    ["another domain", { hd: "gmail.com" }],
    ["lookalike domain", { hd: "ufm.edu", email: "ana@ufm.edu.evil.com" }],
    ["unverified email", { email_verified: false }],
    ["another client's token", { aud: "999.apps.googleusercontent.com" }],
    ["expired", { exp: Math.floor(NOW / 1000) - 1 }],
    ["wrong issuer", { iss: "https://evil.example" }],
  ])("refuses an ID token that is %s", async (_name, over) => {
    const { finish } = setup({ token: (n) => idToken(good(n, over)) });
    expect(await finish()).toMatchObject({ ok: false, error: "google_rechazado" });
  });

  it("refuses a token for another request (nonce), another key, or an algorithm of its own choosing", async () => {
    expect(await setup({ token: () => idToken(good("nonce-ajeno")) }).finish()).toMatchObject({
      error: "google_rechazado",
      detail: "nonce",
    });
    expect(
      await setup({ token: (n) => idToken(good(n), { key: other.privateKey }) }).finish(),
    ).toMatchObject({ error: "google_rechazado", detail: "firma inválida" });
    expect(
      await setup({
        token: (n) => idToken(good(n), { header: { kid: "k-desconocida" } }),
      }).finish(),
    ).toMatchObject({ error: "google_rechazado", detail: "llave desconocida" });
    expect(
      await setup({ token: (n) => idToken(good(n), { header: { alg: "none" } }) }).finish(),
    ).toMatchObject({ error: "google_rechazado", detail: "algoritmo" });
    expect(
      await setup({
        token: (n) => `${b64({ alg: "RS256", kid: "k1" })}.${b64(good(n))}.`,
      }).finish(),
    ).toMatchObject({ error: "google_rechazado" });
    expect(await setup({ token: () => "no-es-un-jwt" }).finish()).toMatchObject({
      error: "google_rechazado",
    });
  });

  it("Google being down is `no_disponible`, not a refusal of the person", async () => {
    expect(await setup({ down: true }).finish()).toMatchObject({ error: "google_no_disponible" });
    expect(await setup({ tokenStatus: 503 }).finish()).toMatchObject({
      error: "google_no_disponible",
    });
    expect(await setup({ jwksStatus: 500 }).finish()).toMatchObject({
      error: "google_no_disponible",
    });
  });

  it("if the credentials disappear or the host changes mid-sign-in, it does not go on", async () => {
    const { s, fetch } = setup();
    const back = { code: "code-1", state: s.state, error: null };
    expect(
      await finishGoogleSignIn(back, s.cookie, ORIGIN, { env: {}, fetch, now: () => NOW }),
    ).toMatchObject({ error: "google_no_disponible" });
    expect(
      await finishGoogleSignIn(back, s.cookie, "https://otro.vercel.app", {
        env: ENV,
        fetch,
        now: () => NOW,
      }),
    ).toMatchObject({ error: "google_no_disponible" });
  });

  it("verifyIdToken alone: accepts the token exactly once the checks pass", async () => {
    const { s, fetch } = setup();
    const token = idToken(good(s.nonce));
    const p = { clientId: CLIENT_ID, nonce: s.nonce, nowSeconds: Math.floor(NOW / 1000) };
    expect(await verifyIdToken(token, p, fetch)).toMatchObject({ ok: true });
    expect(await verifyIdToken(token, { ...p, nonce: "x" }, fetch)).toMatchObject({ ok: false });
    expect(await verifyIdToken(token, { ...p, clientId: "x" }, fetch)).toMatchObject({ ok: false });
  });
});

describe("the identity opens a session only for what was verified", () => {
  const client = { userAgent: "Chrome/1 Macintosh", lugar: "Ciudad de Guatemala" };
  beforeEach(() => vi.stubEnv("GOOGLE_CLIENT_ID", CLIENT_ID));
  afterEach(() => vi.unstubAllEnvs());
  const claims = (over = {}) => ({
    iss: "https://accounts.google.com",
    aud: CLIENT_ID,
    exp: Math.floor(Date.now() / 1000) + 600,
    email: "Maria.Perez@ufm.edu",
    email_verified: true,
    hd: "ufm.edu",
    ...over,
  });

  it("signs in the real person, with a student account of their own", async () => {
    const signed = await new MockIdentity().signInWithGoogle(client, claims());
    expect(signed.ok && signed.value.user).toMatchObject({
      correo: "maria.perez@ufm.edu",
      rol: "estudiante",
    });
  });

  it("repeats the claim checks itself", async () => {
    const id = new MockIdentity();
    expect(await id.signInWithGoogle(client, claims({ hd: "gmail.com" }))).toMatchObject({
      error: "google_rechazado",
    });
    expect(await id.signInWithGoogle(client, claims({ aud: "otro" }))).toMatchObject({
      error: "google_rechazado",
    });
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    expect(await id.signInWithGoogle(client, claims())).toMatchObject({
      error: "google_rechazado",
    });
  });

  it("without claims it is still the simulated demo student (the fallback)", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    const signed = await new MockIdentity().signInWithGoogle(client);
    expect(signed.ok && signed.value.user.correo).toBe("ana.lopez.demo@ufm.edu");
  });
});

/** The two route handlers, end to end, with Google answered over HTTP and the session cookie mocked. */
describe("route handlers", () => {
  beforeEach(() => {
    started.sessions.length = 0;
    resetAdapters();
    forgetWarnings();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const req = (path: string, cookie?: string) =>
    new NextRequest(`${ORIGIN}${path}`, {
      headers: {
        host: "miu-2026.vercel.app",
        "x-forwarded-proto": "https",
        ...(cookie ? { cookie } : {}),
      },
    });
  const loadStart = async () => (await import("@/app/(auth)/login/google/start/route")).GET;
  const loadCallback = async () => (await import("@/app/(auth)/login/google/callback/route")).GET;

  it("start without credentials goes back to /login and says why in the log", async () => {
    const res = (await loadStart())(req("/login/google/start"));
    expect(res.status).toBe(302);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
    expect(res.cookies.get(GOOGLE_STATE_COOKIE)).toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("GOOGLE_CLIENT_ID"));
  });

  it("with credentials: start → Google → callback → session, all over HTTP", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", CLIENT_ID);
    vi.stubEnv("GOOGLE_CLIENT_SECRET", SECRET);
    vi.stubEnv("GOOGLE_REDIRECT_URI", REDIRECT);

    const go = (await loadStart())(req("/login/google/start"));
    expect(go.status).toBe(302);
    const to = new URL(go.headers.get("location")!);
    expect(`${to.origin}${to.pathname}`).toBe(GOOGLE_AUTH_URL);
    const cookie = go.cookies.get(GOOGLE_STATE_COOKIE)!;
    expect(cookie).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/login/google",
    });

    const fake: Fake = { token: (n) => idToken(good(n)), calls: [] };
    vi.stubGlobal(
      "fetch",
      fakeGoogle(fake, {
        challenge: to.searchParams.get("code_challenge")!,
        nonce: to.searchParams.get("nonce")!,
      }),
    );
    // Vitest's real clock is after the token's `exp` (Nov 2026 fixture): make the token current.
    fake.token = (n) => idToken(good(n, { exp: Math.floor(Date.now() / 1000) + 600 }));

    const back = await (
      await loadCallback()
    )(
      req(
        `/login/google/callback?code=code-1&state=${to.searchParams.get("state")}`,
        `${GOOGLE_STATE_COOKIE}=${cookie.value}`,
      ),
    );
    expect(back.status).toBe(302);
    expect(new URL(back.headers.get("location")!).pathname).toBe("/");
    expect(started.sessions).toHaveLength(1);
    expect(started.sessions[0]).toMatchObject({ user: { correo: "maria.perez@ufm.edu" } });
    // The one-time cookie is cleared.
    expect(back.cookies.get(GOOGLE_STATE_COOKIE)?.value).toBe("");
    // The client secret only ever went to Google's token endpoint.
    expect(JSON.stringify([...back.headers])).not.toContain(SECRET);
  });

  it("a callback that does not check out returns to the login page and opens no session", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", CLIENT_ID);
    vi.stubEnv("GOOGLE_CLIENT_SECRET", SECRET);
    vi.stubEnv("GOOGLE_REDIRECT_URI", REDIRECT);
    const denied = await (await loadCallback())(req("/login/google/callback?error=access_denied"));
    expect(denied.headers.get("location")).toContain("/login?google=rechazado");
    const forged = await (
      await loadCallback()
    )(req("/login/google/callback?code=code-1&state=x", `${GOOGLE_STATE_COOKIE}=falsa.firma`));
    expect(forged.headers.get("location")).toContain("/login?google=rechazado");
    expect(started.sessions).toHaveLength(0);
  });
});
