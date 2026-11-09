import { signToken, verifyToken } from "./demo-token";

/**
 * Small signed cookies for what a mock adapter would otherwise keep only in one instance's memory
 * (src/lib/demo-token.ts explains why that breaks on serverless hosts). Signed with the same secret,
 * so a browser can carry the state but cannot invent it. `next/headers` is imported inside each call:
 * the ports' index files are also reached from Client Components (for their types and helpers), and a
 * top-level import would put it in the browser bundle. Both calls are no-ops outside a request
 * (unit tests) and reads are the only thing a Server Component may do: writing needs a Server Action
 * or a Route Handler, and elsewhere it is skipped on purpose.
 */
export async function readDemoCookie<T extends object>(name: string): Promise<T | null> {
  try {
    const { cookies } = await import("next/headers");
    const raw = (await cookies()).get(name)?.value;
    return raw ? verifyToken<T>(raw) : null;
  } catch {
    return null;
  }
}

export async function writeDemoCookie(name: string, payload: object, maxAgeSeconds: number) {
  try {
    const { cookies, headers } = await import("next/headers");
    const secure = (await headers()).get("x-forwarded-proto") === "https";
    (await cookies()).set(name, signToken(payload), {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: maxAgeSeconds,
    });
  } catch {
    // Not in a context that may set cookies: the instance's memory still holds it for this process.
  }
}
