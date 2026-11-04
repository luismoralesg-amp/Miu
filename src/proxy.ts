import { NextResponse, type NextRequest } from "next/server";

import { buildCsp, createNonce } from "@/lib/security/csp";

export function proxy(request: NextRequest) {
  const nonce = createNonce();
  const isHttps =
    request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  const csp = buildCsp({ nonce, isDev: process.env.NODE_ENV === "development", isHttps });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|brand/|icons/|sw.js|offline.css|manifest.webmanifest).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
