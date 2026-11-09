import { NextResponse, type NextRequest } from "next/server";

import {
  GOOGLE_STATE_COOKIE,
  GOOGLE_STATE_PATH,
  GOOGLE_STATE_TTL_S,
  beginGoogleSignIn,
  requestOrigin,
  warnMockGoogle,
} from "@/modules/identity/google/signin";

/**
 * Step 1 of the real Google sign-in: sets the signed cookie and sends the browser to Google. A plain
 * link reaches this, not a form: the CSP's `form-action 'self'` would block a redirect to Google that
 * follows a form submission. Without credentials it answers with the login page, which shows the
 * simulated button instead (the page and this route read the same rule).
 */
export function GET(request: NextRequest) {
  const origin = requestOrigin(request.headers, request.nextUrl.origin);
  const begun = beginGoogleSignIn(origin);
  if (begun.mode === "mock") {
    warnMockGoogle(begun.reason);
    return NextResponse.redirect(new URL("/login", origin), 302);
  }
  const response = NextResponse.redirect(begun.url, 302);
  response.cookies.set(GOOGLE_STATE_COOKIE, begun.cookie, {
    httpOnly: true,
    // Lax: Google brings the browser back with a top-level GET, which Lax cookies accompany.
    sameSite: "lax",
    secure: origin.startsWith("https:"),
    path: GOOGLE_STATE_PATH,
    maxAge: GOOGLE_STATE_TTL_S,
  });
  response.headers.set("cache-control", "no-store");
  return response;
}
