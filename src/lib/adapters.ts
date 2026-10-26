/**
 * Which implementation backs each port: `MIU_ADAPTER_<PUERTO>=mock|real` (docs/PLAN_FASE1.md §6).
 * Anything else, or nothing, means `mock`, so a typo can never point the demo at a real system.
 */
export type AdapterKind = "mock" | "real";

export function adapterKind(port: string, env: Record<string, string | undefined> = process.env) {
  const value = env[`MIU_ADAPTER_${port.toUpperCase()}`]?.trim().toLowerCase();
  return (value === "real" ? "real" : "mock") satisfies AdapterKind;
}

// One instance per port and server process; kept on globalThis so dev hot reloads keep mock state.
const registry = globalThis as unknown as { miuAdapters?: Map<string, unknown> };

export function selectAdapter<T>(
  port: string,
  factories: Record<AdapterKind, () => T>,
  env: Record<string, string | undefined> = process.env,
): T {
  registry.miuAdapters ??= new Map();
  const kind = adapterKind(port, env);
  const key = `${port}:${kind}`;
  if (!registry.miuAdapters.has(key)) registry.miuAdapters.set(key, factories[kind]());
  return registry.miuAdapters.get(key) as T;
}

/** Tests only: forget every instance so each test starts from the seed. */
export function resetAdapters() {
  registry.miuAdapters?.clear();
}
