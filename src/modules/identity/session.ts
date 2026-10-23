import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { describeUserAgent } from "./domain/rules";
import type { Role } from "./domain/types";
import { identity, type ClientInfo, type SignedIn } from "./index";

export const SESSION_COOKIE = "miu-sesion";
/** Address waiting for its code. Kept in an HttpOnly cookie, never in the URL. */
export const LOGIN_COOKIE = "miu-ingreso";
/** This browser's device id (also where a registered passkey lives). */
export const DEVICE_COOKIE = "miu-dispositivo";

async function isHttps() {
  return (await headers()).get("x-forwarded-proto") === "https";
}

export async function clientInfo(): Promise<ClientInfo> {
  const ua = (await headers()).get("user-agent") ?? "";
  const deviceId = (await cookies()).get(DEVICE_COOKIE)?.value;
  // Approximate location comes from the edge in production; the mock uses a fixed city.
  return { userAgent: ua, lugar: "Ciudad de Guatemala", deviceId };
}

export async function describeThisDevice() {
  return describeUserAgent((await headers()).get("user-agent") ?? "");
}

export async function startSession({ session }: SignedIn, recordar: boolean) {
  const jar = await cookies();
  const secure = await isHttps();
  jar.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    ...(recordar ? { expires: new Date(session.expira) } : {}),
  });
  // This browser's device id: signing in again reuses the same device in the list.
  jar.set(DEVICE_COOKIE, session.deviceId, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  jar.delete(LOGIN_COOKIE);
}

export async function setPendingEmail(correo: string) {
  (await cookies()).set(LOGIN_COOKIE, correo, {
    httpOnly: true,
    sameSite: "lax",
    secure: await isHttps(),
    path: "/login",
    maxAge: 600,
  });
}

export async function pendingEmail() {
  return (await cookies()).get(LOGIN_COOKIE)?.value ?? null;
}

export type CurrentUser = SignedIn & { rol: Role };

export async function currentUser(): Promise<CurrentUser | null> {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const result = await identity().getSession(id);
  if (!result.ok) return null;
  return { ...result.value, rol: result.value.session.rolActivo ?? result.value.user.rol };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function endSession() {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) await identity().signOut(id);
  jar.delete(SESSION_COOKIE);
}

/** Developer catalog, role switcher and the mock outbox: off in production unless MIU_DEV_TOOLS=1. */
export function devToolsEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.MIU_DEV_TOOLS === "1";
}
