import type { Actor } from "@/modules/identity";

/** Actors for port tests. Each test session gets its own userId, like an E2E account. */
let n = 0;
const next = () => `u-test-${++n}`;

export const student = (): Actor => ({
  userId: next(),
  personId: "p-ana",
  role: "estudiante",
  nombre: "Ana López",
});
export const maestro = (): Actor => ({
  userId: next(),
  personId: "p-jorge",
  role: "maestro",
  nombre: "Jorge Castillo",
});
export const auxiliar = (personId = "p-carlos"): Actor => ({
  userId: next(),
  personId,
  role: "auxiliar",
  nombre: "Carlos Méndez",
});
export const admin = (): Actor => ({
  userId: next(),
  personId: "p-rodrigo",
  role: "administrativo",
  nombre: "Rodrigo Ajú",
});

/** Unwraps a port result in tests, failing loudly with the error. */
export function value<T>(
  r: { ok: true; value: T } | { ok: false; error: string; detail?: string },
): T {
  if (!r.ok) throw new Error(`${r.error}${r.detail ? `: ${r.detail}` : ""}`);
  return r.value;
}
