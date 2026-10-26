import { fail } from "./result";

/**
 * The `real` adapter of a port that is not wired yet: every method answers `unavailable` with the name
 * of the system it will talk to, so turning it on by mistake shows a clear error state, not a crash.
 */
export function notConnected<T extends object>(system: string): T {
  return new Proxy({} as T, {
    get: (_target, key) =>
      typeof key === "string" && key !== "then"
        ? async () => fail("unavailable", `${system}: adaptador real sin conectar`)
        : undefined,
  });
}
