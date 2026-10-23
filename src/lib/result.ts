/** Explicit success or failure for port calls; errors are data, never thrown across a port. */
export type Result<T, E extends string = string> =
  { ok: true; value: T } | { ok: false; error: E; detail?: string };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const fail = <E extends string>(error: E, detail?: string): Result<never, E> =>
  detail === undefined ? { ok: false, error } : { ok: false, error, detail };
