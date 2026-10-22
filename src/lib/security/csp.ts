export type CspOptions = {
  nonce: string;
  isDev: boolean;
  isHttps: boolean;
};

/**
 * Builds the Content-Security-Policy for one request.
 *
 * Scripts only run with the per-request nonce ('strict-dynamic' lets Next.js load its own chunks).
 * Style attributes are the one inline exception: animation libraries set initial styles in the
 * server-rendered markup, and a style attribute cannot execute script. See docs/DECISIONES.md.
 */
export function buildCsp({ nonce, isDev, isHttps }: CspOptions): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    "style-src": ["'self'", `'nonce-${nonce}'`],
    "style-src-attr": ["'unsafe-inline'"],
    "img-src": ["'self'", "blob:", "data:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'", ...(isDev ? ["ws:"] : [])],
    "manifest-src": ["'self'"],
    "worker-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  const policy = Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`);
  if (isHttps) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}

export function createNonce(): string {
  return btoa(crypto.randomUUID());
}
