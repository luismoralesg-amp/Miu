import { describe, expect, it } from "vitest";

import { buildCsp, createNonce } from "./csp";

function directives(policy: string): Map<string, string> {
  return new Map(
    policy.split("; ").map((part) => {
      const [name = "", ...values] = part.split(" ");
      return [name, values.join(" ")];
    }),
  );
}

describe("buildCsp", () => {
  const nonce = "dGVzdC1ub25jZQ==";

  it("only lets scripts run with the request nonce in production", () => {
    const csp = directives(buildCsp({ nonce, isDev: false, isHttps: true }));
    expect(csp.get("script-src")).toBe(`'self' 'nonce-${nonce}' 'strict-dynamic'`);
    expect(csp.get("script-src")).not.toContain("unsafe");
  });

  it("allows eval only in development", () => {
    const csp = directives(buildCsp({ nonce, isDev: true, isHttps: false }));
    expect(csp.get("script-src")).toContain("'unsafe-eval'");
  });

  it("blocks framing, plugins and foreign form targets", () => {
    const csp = directives(buildCsp({ nonce, isDev: false, isHttps: true }));
    expect(csp.get("frame-ancestors")).toBe("'none'");
    expect(csp.get("object-src")).toBe("'none'");
    expect(csp.get("form-action")).toBe("'self'");
  });

  it("upgrades insecure requests only when served over HTTPS", () => {
    expect(buildCsp({ nonce, isDev: false, isHttps: true })).toContain("upgrade-insecure-requests");
    expect(buildCsp({ nonce, isDev: false, isHttps: false })).not.toContain(
      "upgrade-insecure-requests",
    );
  });

  it("loads nothing from external origins", () => {
    const policy = buildCsp({ nonce, isDev: false, isHttps: true });
    expect(policy).not.toMatch(/https?:\/\//);
  });
});

describe("createNonce", () => {
  it("returns a fresh base64 value on each call", () => {
    const first = createNonce();
    expect(first).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(createNonce()).not.toBe(first);
  });
});
