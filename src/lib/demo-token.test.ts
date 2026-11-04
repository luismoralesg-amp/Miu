import { describe, expect, it } from "vitest";

import { acceptsDemoCode, demoCode, signToken, verifyToken } from "./demo-token";

describe("signed tokens", () => {
  it("round-trips a payload and refuses a tampered one, another secret and junk", () => {
    const token = signToken({ uid: "u-ana", exp: 1 }, "s1");
    expect(verifyToken(token, "s1")).toEqual({ uid: "u-ana", exp: 1 });
    expect(verifyToken(token, "s2")).toBeNull();
    const [body, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ uid: "u-rodrigo", exp: 1 })).toString("base64url");
    expect(verifyToken(`${forged}.${sig}`, "s1")).toBeNull();
    expect(verifyToken(`${body}.`, "s1")).toBeNull();
    expect(verifyToken("nada", "s1")).toBeNull();
    expect(verifyToken(`${token}.x`, "s1")).toBeNull();
  });
});

describe("derived codes", () => {
  it("are six digits, stable for a subject and window, and differ by subject and secret", () => {
    const code = demoCode("login", "ana@ufm.edu", 7, "s1");
    expect(code).toMatch(/^\d{6}$/);
    expect(demoCode("login", "ana@ufm.edu", 7, "s1")).toBe(code);
    expect(demoCode("login", "otra@ufm.edu", 7, "s1")).not.toBe(code);
    expect(demoCode("login", "ana@ufm.edu", 7, "s2")).not.toBe(code);
    expect(demoCode("stepup", "ana@ufm.edu", 7, "s1")).not.toBe(code);
  });

  it("are accepted for the window they were asked in and the next one, not later", () => {
    const ttl = 600_000;
    const askedAt = 5 * ttl + 1000;
    const code = demoCode("login", "a", 5, "s");
    expect(acceptsDemoCode("login", "a", code, askedAt, ttl, "s")).toBe(true);
    expect(acceptsDemoCode("login", "a", code, askedAt + ttl, ttl, "s")).toBe(true);
    expect(acceptsDemoCode("login", "a", code, askedAt + 2 * ttl, ttl, "s")).toBe(false);
    expect(acceptsDemoCode("login", "a", "000000", askedAt, ttl, "s")).toBe(false);
  });
});
