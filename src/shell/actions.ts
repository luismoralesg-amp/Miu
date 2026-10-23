"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { identity, roles, type Role } from "@/modules/identity";
import { SESSION_COOKIE, devToolsEnabled } from "@/modules/identity/session";

/** Development only: view the app as another role without signing in again. */
export async function cambiarRol(rol: Role) {
  if (!devToolsEnabled() || !roles.includes(rol)) return;
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (id) await identity().setActiveRole(id, rol);
  revalidatePath("/", "layout");
}
