import { cookies } from "next/headers";

import { devToolsEnabled } from "@/modules/identity/session";

import { fail, portErrors, type PortError, type PortResult } from "./result";

export const FAULT_COOKIE = "miu-falla";

/**
 * Development only: `miu-falla=<puerto>:<error>` (e.g. `assessment:timeout`) makes that port answer
 * with the error, so the loading, error and timeout states can be seen and tested on real screens.
 * Ignored in production unless MIU_DEV_TOOLS=1.
 */
export async function withFault<T>(port: string, call: () => PortResult<T>): PortResult<T> {
  if (devToolsEnabled()) {
    const value = (await cookies()).get(FAULT_COOKIE)?.value;
    const [target, error] = value?.split(":") ?? [];
    if (target === port && portErrors.includes(error as PortError))
      return fail(error as PortError, "falla simulada");
  }
  return call();
}
