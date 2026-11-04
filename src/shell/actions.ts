"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";

import { identity, roles, type Role } from "@/modules/identity";
import { SESSION_TTL_MS } from "@/modules/identity/domain/rules";
import { SESSION_COOKIE, devToolsEnabled } from "@/modules/identity/session";

/** Development only: view the app as another role without signing in again. */
export async function cambiarRol(rol: Role) {
  if (!devToolsEnabled() || !roles.includes(rol)) return;
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) {
    const result = await identity().setActiveRole(id, rol);
    // The role is part of the signed cookie, so the browser must hold the new one.
    if (result.ok)
      jar.set(SESSION_COOKIE, result.value.id, {
        httpOnly: true,
        sameSite: "lax",
        secure: (await headers()).get("x-forwarded-proto") === "https",
        path: "/",
        ...(Date.parse(result.value.expira) - Date.parse(result.value.creada) > SESSION_TTL_MS
          ? { expires: new Date(result.value.expira) }
          : {}),
      });
  }
  revalidatePath("/", "layout");
}
