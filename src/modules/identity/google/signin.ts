import { timingSafeEqual } from "node:crypto";

import { signToken, verifyToken } from "@/lib/demo-token";
import { fail, type Result } from "@/lib/result";

import type { GoogleClaims } from "../domain/rules";
import {
  GOOGLE_CALLBACK_PATH,
  authorizationUrl,
  exchangeCode,
  newChallenge,
  randomToken,
  verifyIdToken,
  type GoogleConfig,
  type GoogleError,
} from "./oidc";

/** Where the browser keeps what the callback needs to recognise its own request (10 minutes). */
export const GOOGLE_STATE_COOKIE = "miu-google";
export const GOOGLE_STATE_PATH = "/login/google";
export const GOOGLE_STATE_TTL_S = 600;

type Env = Record<string, string | undefined>;
const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

/**
 * Real Google sign-in when its credentials are there; otherwise the mock, so the demo never breaks:
 *
 * - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` missing: mock.
 * - `GOOGLE_REDIRECT_URI` missing (outside localhost) or set for another host than this request's (a
 *   Vercel preview whose URL is not registered in Google Cloud Console would otherwise end on Google's
 *   "redirect_uri_mismatch" page): mock.
 * - `MIU_GOOGLE_MODE=mock`: mock, on purpose (to record the demo with the simulated account).
 */
export type GoogleMode = { mode: "real"; config: GoogleConfig } | { mode: "mock"; reason: string };

export function googleMode(origin: string, env: Env = process.env): GoogleMode {
  if (env.MIU_GOOGLE_MODE?.trim().toLowerCase() === "mock")
    return { mode: "mock", reason: "MIU_GOOGLE_MODE=mock" };
  const clientId = env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret)
    return { mode: "mock", reason: "faltan GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET" };
  const registered = env.GOOGLE_REDIRECT_URI?.trim();
  if (!registered) {
    // Google only accepts redirect URIs registered one by one, so the host cannot be guessed from the
    // request except on localhost, where the registered one is known. Anywhere else it must be set.
    if (!LOCAL_ORIGIN.test(origin))
      return { mode: "mock", reason: `falta GOOGLE_REDIRECT_URI para ${origin}` };
    return {
      mode: "real",
      config: { clientId, clientSecret, redirectUri: `${origin}${GOOGLE_CALLBACK_PATH}` },
    };
  }
  let registeredOrigin: string;
  try {
    registeredOrigin = new URL(registered).origin;
  } catch {
    return { mode: "mock", reason: "GOOGLE_REDIRECT_URI no es una URL" };
  }
  if (registeredOrigin !== origin)
    return {
      mode: "mock",
      reason: `GOOGLE_REDIRECT_URI es de ${registeredOrigin} y esta solicitud es de ${origin}`,
    };
  return { mode: "real", config: { clientId, clientSecret, redirectUri: registered } };
}

/** The public origin of this request, behind a proxy too (Vercel sets the `x-forwarded-*` headers). */
export function requestOrigin(headers: Pick<Headers, "get">, fallback: string): string {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host) return fallback;
  const proto =
    headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    (/^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(host) ? "http" : "https");
  return `${proto}://${host.split(",")[0]!.trim()}`;
}

type StateClaims = { k: "g"; s: string; n: string; v: string; r: string; e: number };

export type GoogleStart =
  { mode: "mock"; reason: string } | { mode: "real"; url: string; cookie: string };

/** Step 1: the address to send the browser to, and the signed cookie it must bring back. */
export function beginGoogleSignIn(
  origin: string,
  { env = process.env, now = Date.now }: { env?: Env; now?: () => number } = {},
): GoogleStart {
  const decided = googleMode(origin, env);
  if (decided.mode === "mock") return decided;
  const state = randomToken();
  const nonce = randomToken();
  const { verifier, challenge } = newChallenge();
  return {
    mode: "real",
    url: authorizationUrl(decided.config, { state, nonce, challenge }),
    cookie: signToken({
      k: "g",
      s: state,
      n: nonce,
      v: verifier,
      r: decided.config.redirectUri,
      e: now() + GOOGLE_STATE_TTL_S * 1000,
    } satisfies StateClaims),
  };
}

const same = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/**
 * Step 2: what Google sent back. Checks the browser is the one that started it (state), trades the
 * code (PKCE verifier), verifies the ID token and its claims. Never throws.
 */
export async function finishGoogleSignIn(
  back: { code: string | null; state: string | null; error: string | null },
  cookie: string | undefined,
  origin: string,
  {
    env = process.env,
    fetch: fetchImpl = fetch,
    now = Date.now,
  }: { env?: Env; fetch?: typeof fetch; now?: () => number } = {},
): Promise<Result<GoogleClaims, GoogleError>> {
  if (back.error) return fail("google_rechazado", back.error);
  const claims = cookie ? verifyToken<StateClaims>(cookie) : null;
  const complete =
    claims?.k === "g" &&
    [claims.s, claims.n, claims.v, claims.r].every((v) => typeof v === "string" && v) &&
    typeof claims.e === "number";
  if (!claims || !complete || now() > claims.e)
    return fail("google_rechazado", "la solicitud venció o no empezó aquí");
  if (!back.state || !same(back.state, claims.s)) return fail("google_rechazado", "state");
  if (!back.code) return fail("google_rechazado", "sin código");
  const decided = googleMode(origin, env);
  if (decided.mode !== "real" || decided.config.redirectUri !== claims.r)
    return fail("google_no_disponible", "la configuración cambió durante el ingreso");
  const idToken = await exchangeCode(decided.config, back.code, claims.v, fetchImpl);
  if (!idToken.ok) return idToken;
  return verifyIdToken(
    idToken.value,
    { clientId: decided.config.clientId, nonce: claims.n, nowSeconds: Math.floor(now() / 1000) },
    fetchImpl,
  );
}

const warned = new Set<string>();
/** The reason the demo is using the simulated account, once per reason and process. */
export function warnMockGoogle(reason: string, log: (message: string) => void = console.warn) {
  if (warned.has(reason)) return;
  warned.add(reason);
  log(`[google] Inicio de sesión simulado (mock): ${reason}.`);
}
/** Tests only. */
export function forgetWarnings() {
  warned.clear();
}
