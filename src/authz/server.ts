import { notFound } from "next/navigation";

import { requireUser, type CurrentUser } from "@/modules/identity/session";

import { roleCan } from "./can";
import type { Permission } from "./matrix";

/**
 * Route guard: the signed-in user's role must hold every permission listed. A role without access gets
 * the same 404 as a page that does not exist, so URLs never reveal what other roles can do.
 */
export async function requirePermission(...needed: Permission[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!needed.every((p) => roleCan(user.rol, p))) notFound();
  return user;
}
