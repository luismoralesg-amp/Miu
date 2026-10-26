/** Explicit success or failure for port calls; errors are data, never thrown across a port. */
export type Result<T, E extends string = string> =
  { ok: true; value: T } | { ok: false; error: E; detail?: string };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const fail = <E extends string>(error: E, detail?: string): Result<never, E> =>
  detail === undefined ? { ok: false, error } : { ok: false, error, detail };

/** The only errors a data port may return (docs/PLAN_FASE1.md §6). */
export const portErrors = ["timeout", "unavailable", "forbidden", "not_found", "invalid"] as const;
export type PortError = (typeof portErrors)[number];
export type PortResult<T> = Promise<Result<T, PortError>>;

/** No port call may hang longer than this. */
export const PORT_TIMEOUT_MS = 10_000;

export type CallOptions = { ms?: number; signal?: AbortSignal | undefined };

/**
 * Runs a port call with a time budget (never more than 10 s). The call receives an AbortSignal that
 * fires on timeout or when the caller aborts, so real adapters can cancel their fetch. Thrown errors
 * become `unavailable`: a port never throws at its caller.
 */
export async function withTimeout<T>(
  run: (signal: AbortSignal) => Promise<Result<T, PortError>>,
  { ms = PORT_TIMEOUT_MS, signal }: CallOptions = {},
): Promise<Result<T, PortError>> {
  const budget = Math.min(Math.max(ms, 0), PORT_TIMEOUT_MS);
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;

  const stopped = new Promise<Result<T, PortError>>((resolve) => {
    timer = setTimeout(() => {
      controller.abort(new DOMException("timeout", "TimeoutError"));
      resolve(fail("timeout", `Sin respuesta en ${budget} ms`));
    }, budget);
    if (signal) {
      onAbort = () => {
        controller.abort(signal.reason);
        resolve(fail("unavailable", "cancelada"));
      };
      if (signal.aborted) onAbort();
      else signal.addEventListener("abort", onAbort, { once: true });
    }
  });

  const call = (async () => {
    try {
      return await run(controller.signal);
    } catch (error) {
      return fail("unavailable", error instanceof Error ? error.message : String(error));
    }
  })();

  try {
    return await Promise.race([call, stopped]);
  } finally {
    clearTimeout(timer);
    if (signal && onAbort) signal.removeEventListener("abort", onAbort);
  }
}

/**
 * Wraps every method of an adapter so each call gets the time budget of `withTimeout`. Mock adapters
 * stay plain classes; the guard is applied once where the adapter is selected.
 */
export function guarded<T extends object>(adapter: T, ms = PORT_TIMEOUT_MS): T {
  return new Proxy(adapter, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver);
      if (typeof value !== "function") return value;
      return (...args: unknown[]) =>
        withTimeout(async () => (await value.apply(target, args)) as Result<unknown, PortError>, {
          ms,
        });
    },
  });
}

/** Unwraps a result or throws, for server components that render an error boundary on failure. */
export class PortFailure extends Error {
  constructor(
    readonly error: PortError,
    readonly detail?: string,
  ) {
    super(detail ? `${error}: ${detail}` : error);
    this.name = "PortFailure";
  }
}

export function unwrap<T>(result: Result<T, PortError>): T {
  if (result.ok) return result.value;
  throw new PortFailure(result.error, result.detail);
}
