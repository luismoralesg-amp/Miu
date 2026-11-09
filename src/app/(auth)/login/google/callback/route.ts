import { NextResponse, type NextRequest } from "next/server";

import { identity } from "@/modules/identity";
import {
  GOOGLE_STATE_COOKIE,
  GOOGLE_STATE_PATH,
  finishGoogleSignIn,
  requestOrigin,
} from "@/modules/identity/google/signin";
import { clientInfo, startSession } from "@/modules/identity/session";

/**
 * Step 2: Google sends the browser back here with a one-time code. The code is traded on the server,
 * the ID token is verified (signature, audience, expiry, `hd = ufm.edu`) and only then is a session
 * opened. Any failure returns to the login page with a short code; nothing from Google is echoed.
 */
export async function GET(request: NextRequest) {
  const origin = requestOrigin(request.headers, request.nextUrl.origin);
  const q = request.nextUrl.searchParams;
  const finish = (to: string) => {
    const response = NextResponse.redirect(new URL(to, origin), 302);
    response.cookies.set(GOOGLE_STATE_COOKIE, "", { path: GOOGLE_STATE_PATH, maxAge: 0 });
    response.headers.set("cache-control", "no-store");
    return response;
  };

  const verified = await finishGoogleSignIn(
    { code: q.get("code"), state: q.get("state"), error: q.get("error") },
    request.cookies.get(GOOGLE_STATE_COOKIE)?.value,
    origin,
  );
  if (!verified.ok) {
    console.warn(`[google] Ingreso no completado: ${verified.error} (${verified.detail ?? "—"})`);
    return finish(
      `/login?google=${verified.error === "google_no_disponible" ? "no_disponible" : "rechazado"}`,
    );
  }
  const signed = await identity().signInWithGoogle(await clientInfo(), verified.value);
  if (!signed.ok) {
    console.warn(`[google] La identidad no abrió sesión: ${signed.error}`);
    return finish("/login?google=rechazado");
  }
  await startSession(signed.value, false);
  return finish("/");
}
