import { createHash, createPublicKey, randomBytes, verify } from "node:crypto";

import { fail, ok, type Result } from "@/lib/result";

import { acceptGoogleClaims, type GoogleClaims } from "../domain/rules";

/**
 * Google OpenID Connect, authorization-code flow with PKCE, for the one thing MiU asks of Google:
 * who is this person (`openid email`). Nothing else is requested, so there is no consent for files,
 * calendar or contacts. Every network call takes `fetch` as a parameter so tests can answer in place
 * of Google (ARQUITECTURA_MIU.md §4.2: the ID token is verified on the server, `hd` is only a hint).
 */
export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
export const GOOGLE_SCOPES = "openid email";
export const GOOGLE_CALLBACK_PATH = "/login/google/callback";

export type GoogleConfig = { clientId: string; clientSecret: string; redirectUri: string };
export type GoogleError = "google_rechazado" | "google_no_disponible";
type Fetch = typeof fetch;

const sha256 = (value: string) => createHash("sha256").update(value).digest("base64url");
const TIMEOUT_MS = 8_000;

export function newChallenge() {
  const verifier = randomBytes(32).toString("base64url");
  return { verifier, challenge: sha256(verifier) };
}

export function randomToken() {
  return randomBytes(24).toString("base64url");
}

export function authorizationUrl(
  config: GoogleConfig,
  p: { state: string; nonce: string; challenge: string },
) {
  const url = new URL(GOOGLE_AUTH_URL);
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    state: p.state,
    nonce: p.nonce,
    code_challenge: p.challenge,
    code_challenge_method: "S256",
    // A hint for the account chooser only; the server checks the `hd` claim itself.
    hd: "ufm.edu",
    prompt: "select_account",
  }).toString();
  return url.toString();
}

/** Trades the one-time code for the ID token. The client secret never leaves this request. */
export async function exchangeCode(
  config: GoogleConfig,
  code: string,
  verifier: string,
  fetchImpl: Fetch = fetch,
): Promise<Result<string, GoogleError>> {
  let res: Response;
  try {
    res = await fetchImpl(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    return fail("google_no_disponible", "token: sin respuesta");
  }
  // 400 invalid_grant: the code was used, expired or does not match: the person must start again.
  if (res.status === 400 || res.status === 401)
    return fail("google_rechazado", `token ${res.status}`);
  if (!res.ok) return fail("google_no_disponible", `token ${res.status}`);
  const body = (await res.json().catch(() => null)) as { id_token?: unknown } | null;
  return typeof body?.id_token === "string"
    ? ok(body.id_token)
    : fail("google_no_disponible", "token: sin id_token");
}

type Jwk = { kid?: string; kty?: string; alg?: string; n?: string; e?: string };

const decode = (part: string) =>
  JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as unknown;

/**
 * Checks the ID token the way Google documents: RS256 signature against Google's published keys,
 * then issuer, audience, expiry, `email_verified`, and the `hd` claim (`acceptGoogleClaims`), plus
 * the nonce this browser started with.
 */
export async function verifyIdToken(
  idToken: string,
  p: { clientId: string; nonce: string; nowSeconds: number },
  fetchImpl: Fetch = fetch,
): Promise<Result<GoogleClaims, GoogleError>> {
  const parts = idToken.split(".");
  if (parts.length !== 3) return fail("google_rechazado", "id_token mal formado");
  const [h, b, s] = parts as [string, string, string];
  let header: { alg?: string; kid?: string };
  let claims: GoogleClaims & { nonce?: string };
  try {
    header = decode(h) as typeof header;
    claims = decode(b) as typeof claims;
  } catch {
    return fail("google_rechazado", "id_token mal formado");
  }
  // Only RS256: never `none`, never a symmetric algorithm picked by the token itself.
  if (header.alg !== "RS256" || !header.kid) return fail("google_rechazado", "algoritmo");

  let keys: Jwk[];
  try {
    const res = await fetchImpl(GOOGLE_JWKS_URL, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return fail("google_no_disponible", `llaves ${res.status}`);
    keys = ((await res.json()) as { keys?: Jwk[] }).keys ?? [];
  } catch {
    return fail("google_no_disponible", "llaves: sin respuesta");
  }
  const jwk = keys.find((k) => k.kid === header.kid && k.kty === "RSA");
  if (!jwk) return fail("google_rechazado", "llave desconocida");

  let signed = false;
  try {
    signed = verify(
      "RSA-SHA256",
      Buffer.from(`${h}.${b}`),
      createPublicKey({ key: jwk as never, format: "jwk" }),
      Buffer.from(s, "base64url"),
    );
  } catch {
    signed = false;
  }
  if (!signed) return fail("google_rechazado", "firma inválida");
  if (claims.nonce !== p.nonce) return fail("google_rechazado", "nonce");
  if (!acceptGoogleClaims(claims, p.clientId, p.nowSeconds))
    return fail("google_rechazado", "cuenta no aceptada");
  return ok({
    iss: claims.iss,
    aud: claims.aud,
    exp: claims.exp,
    email: claims.email,
    email_verified: claims.email_verified,
    ...(claims.hd ? { hd: claims.hd } : {}),
  });
}
