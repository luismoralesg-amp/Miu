import { afterEach, describe, expect, it, vi } from "vitest";

import { adapterKind, resetAdapters, selectAdapter } from "./adapters";
import {
  PORT_TIMEOUT_MS,
  PortFailure,
  fail,
  guarded,
  ok,
  unwrap,
  withTimeout,
  type PortError,
  type Result,
} from "./result";

afterEach(() => {
  vi.useRealTimers();
  resetAdapters();
});

const never = () => new Promise<Result<number, PortError>>(() => undefined);

describe("Result", () => {
  it("builds ok and fail values", () => {
    expect(ok(3)).toEqual({ ok: true, value: 3 });
    expect(fail("invalid")).toEqual({ ok: false, error: "invalid" });
    expect(fail("invalid", "monto")).toEqual({ ok: false, error: "invalid", detail: "monto" });
  });

  it("unwrap returns the value or throws a PortFailure with the error", () => {
    expect(unwrap(ok("x"))).toBe("x");
    expect(() => unwrap(fail("not_found"))).toThrow(PortFailure);
    try {
      unwrap(fail("forbidden", "sección ajena"));
    } catch (error) {
      expect((error as PortFailure).error).toBe("forbidden");
    }
  });
});

describe("withTimeout", () => {
  it("passes a fast result through", async () => {
    await expect(withTimeout(async () => ok(1))).resolves.toEqual(ok(1));
  });

  it("returns timeout when the call outlives its budget, and aborts the call's signal", async () => {
    vi.useFakeTimers();
    let seen: AbortSignal | undefined;
    const pending = withTimeout(
      (signal) => {
        seen = signal;
        return never();
      },
      { ms: 500 },
    );
    await vi.advanceTimersByTimeAsync(500);
    const result = await pending;
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toBe("timeout");
    expect(seen?.aborted).toBe(true);
  });

  it("never waits longer than 10 s, even if asked to", async () => {
    vi.useFakeTimers();
    const pending = withTimeout(never, { ms: 60_000 });
    await vi.advanceTimersByTimeAsync(PORT_TIMEOUT_MS);
    expect(await pending).toMatchObject({ ok: false, error: "timeout" });
  });

  it("stops when the caller aborts", async () => {
    const controller = new AbortController();
    const pending = withTimeout(never, { signal: controller.signal });
    controller.abort();
    expect(await pending).toMatchObject({ ok: false, error: "unavailable" });
  });

  it("turns a thrown error into unavailable", async () => {
    const result = await withTimeout(async () => {
      throw new Error("conexión rechazada");
    });
    expect(result).toEqual({ ok: false, error: "unavailable", detail: "conexión rechazada" });
  });
});

describe("guarded", () => {
  it("applies the budget to every method of an adapter", async () => {
    vi.useFakeTimers();
    const adapter = guarded(
      { fast: async () => ok("listo"), slow: () => never(), name: "mock" },
      1_000,
    );
    expect(adapter.name).toBe("mock");
    await expect(adapter.fast()).resolves.toEqual(ok("listo"));
    const slow = adapter.slow();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(await slow).toMatchObject({ ok: false, error: "timeout" });
  });
});

describe("adapter selection", () => {
  it("reads MIU_ADAPTER_<PUERTO> and defaults to mock", () => {
    expect(adapterKind("academic", {})).toBe("mock");
    expect(adapterKind("academic", { MIU_ADAPTER_ACADEMIC: "real" })).toBe("real");
    expect(adapterKind("academic", { MIU_ADAPTER_ACADEMIC: " REAL " })).toBe("real");
    expect(adapterKind("academic", { MIU_ADAPTER_ACADEMIC: "produccion" })).toBe("mock");
  });

  it("builds each adapter once per port and kind", () => {
    const mock = vi.fn(() => ({ kind: "mock" }));
    const real = vi.fn(() => ({ kind: "real" }));
    const a = selectAdapter("ledger", { mock, real }, {});
    const b = selectAdapter("ledger", { mock, real }, {});
    expect(a).toBe(b);
    expect(mock).toHaveBeenCalledTimes(1);
    expect(selectAdapter("ledger", { mock, real }, { MIU_ADAPTER_LEDGER: "real" })).toEqual({
      kind: "real",
    });
  });
});
