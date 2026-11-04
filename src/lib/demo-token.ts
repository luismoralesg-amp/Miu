import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stateless proofs for the demo (mock adapters): a signed token and a derived 6-digit code, so any
 * server instance can check what another one issued. Serverless hosts (Vercel) answer each request
 * from a possibly different, possibly new instance, so nothing the demo needs to remember between
 * requests can live in that instance's memory.
 *
 * The secret is MIU_SESSION_SECRET. Without it the demo still works with a built-in secret, which is
 * fine for fictitious data and never for real accounts (the real adapters do not use this file).
 */
const BUILT_IN_SECRET = "miu-demo-secret-not-for-real-accounts";
let warned = false;

export function demoSecret(): string {
  const secret = process.env.MIU_SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production" && !warned) {
    warned = true;
    console.warn("MIU_SESSION_SECRET is not set: the demo uses a built-in secret.");
  }
  return BUILT_IN_SECRET;
}

const b64 = (value: string | Buffer) => Buffer.from(value).toString("base64url");
const mac = (data: string, secret: string) => createHmac("sha256", secret).update(data).digest();

/** `<payload>.<signature>`, both base64url. Cookie-safe and under 1 KB for what the demo stores. */
export function signToken(payload: object, secret = demoSecret()): string {
  const body = b64(JSON.stringify(payload));
  return `${body}.${b64(mac(body, secret))}`;
}

/** The payload if the signature is ours, otherwise null (a tampered or foreign token). */
export function verifyToken<T extends object>(token: string, secret = demoSecret()): T | null {
  const [body, sig, extra] = token.split(".");
  if (!body || !sig || extra !== undefined) return null;
  const expected = mac(body, secret);
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

/** Six digits derived from who it is for and which time window it was asked in. */
export function demoCode(
  scope: string,
  subject: string,
  windowIndex: number,
  secret = demoSecret(),
) {
  const digest = mac(`${scope}|${subject}|${windowIndex}`, secret);
  return String(digest.readUInt32BE(0) % 1_000_000).padStart(6, "0");
}

/**
 * Codes valid for `ttlMs`: the current window's and the previous one's, so a code asked just before
 * a window ends still lasts at least `ttlMs` and never more than twice that.
 */
export function acceptsDemoCode(
  scope: string,
  subject: string,
  code: string,
  now: number,
  ttlMs: number,
  secret = demoSecret(),
) {
  const w = Math.floor(now / ttlMs);
  return [w, w - 1].some((i) => demoCode(scope, subject, i, secret) === code);
}
