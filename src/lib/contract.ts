import type { z } from "zod";

import { fail, ok, type PortError, type Result } from "./result";

/** Validates data crossing a port boundary. A contract break is `invalid`, never a crash. */
export function parsed<T>(schema: z.ZodType<T>, value: unknown): Result<T, PortError> {
  const result = schema.safeParse(value);
  if (result.success) return ok(result.data);
  const issue = result.error.issues[0];
  return fail("invalid", issue ? `${issue.path.join(".")}: ${issue.message}` : "contrato");
}
