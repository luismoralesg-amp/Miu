"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { identity } from "@/modules/identity";
import { DEVICE_COOKIE, requireUser } from "@/modules/identity/session";

export type DeviceState = { error?: string; aviso?: string };

export async function revocarDispositivo(_prev: DeviceState, form: FormData): Promise<DeviceState> {
  const { user, session } = await requireUser();
  const deviceId = String(form.get("dispositivo") ?? "");
  if (deviceId === session.deviceId) return { error: "Para este dispositivo usa Cerrar sesión." };
  const result = await identity().revokeDevice(user.id, deviceId);
  if (!result.ok) return { error: "Ese dispositivo ya no tiene sesión." };
  revalidatePath("/cuenta/dispositivos");
  return {
    aviso: `Listo: cerramos ${result.value.sesionesCerradas === 1 ? "1 sesión" : `${result.value.sesionesCerradas} sesiones`} en ese dispositivo.`,
  };
}

export async function registrarPasskey(): Promise<DeviceState> {
  const { user, session } = await requireUser();
  // Mock: the real adapter runs a WebAuthn registration ceremony here.
  const result = await identity().registerPasskey(user.id, session.deviceId);
  if (!result.ok) return { error: "No pudimos registrar la passkey." };
  (await cookies()).set(DEVICE_COOKIE, session.deviceId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/cuenta/dispositivos");
  return { aviso: "Passkey registrada. La próxima vez entra con “Usar una passkey”." };
}
