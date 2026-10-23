"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { identity, normalizeUfmEmail } from "@/modules/identity";
import {
  DEVICE_COOKIE,
  clientInfo,
  endSession,
  pendingEmail,
  setPendingEmail,
  startSession,
} from "@/modules/identity/session";

export type FormState = { error?: string; aviso?: string; correo?: string };

export async function iniciarConCorreo(_prev: FormState, form: FormData): Promise<FormState> {
  const escrito = String(form.get("correo") ?? "");
  const correo = normalizeUfmEmail(escrito);
  if (!correo)
    return { error: "Usa tu correo de la UFM, que termina en @ufm.edu.", correo: escrito };
  const result = await identity().startEmailSignIn(correo);
  // If a code was sent seconds ago we still continue: the one already in the inbox is valid.
  if (!result.ok && result.error !== "espera") {
    return {
      error: "No pudimos enviar el código. Inténtalo de nuevo en un momento.",
      correo: escrito,
    };
  }
  await setPendingEmail(correo);
  redirect("/login/codigo");
}

const codigoErrores: Record<string, (detalle?: string) => string> = {
  codigo_incorrecto: (d) =>
    `Ese código no coincide. Te ${d === "1" ? "queda 1 intento" : `quedan ${d} intentos`}.`,
  codigo_vencido: () => "El código venció. Pide uno nuevo.",
  bloqueado: () => "Demasiados intentos. Pide un código nuevo para seguir.",
};

export async function verificarCodigo(_prev: FormState, form: FormData): Promise<FormState> {
  const correo = await pendingEmail();
  if (!correo) redirect("/login");
  const codigo = String(form.get("codigo") ?? "").replace(/\D/g, "");
  if (codigo.length !== 6) return { error: "Escribe los 6 dígitos del código." };
  const recordar = form.get("recordar") === "on";
  const result = await identity().verifyCode(correo, codigo, await clientInfo(), recordar);
  if (!result.ok)
    return {
      error: (codigoErrores[result.error] ?? (() => "No pudimos verificar el código."))(
        result.detail,
      ),
    };
  await startSession(result.value, recordar);
  redirect("/");
}

export async function reenviarCodigo(_prev: FormState): Promise<FormState> {
  const correo = await pendingEmail();
  if (!correo) redirect("/login");
  const result = await identity().startEmailSignIn(correo);
  if (!result.ok && result.error === "espera" && result.detail) {
    const segundos = Math.max(1, Math.ceil((Date.parse(result.detail) - Date.now()) / 1000));
    return { aviso: `Ya te enviamos uno. Puedes pedir otro en ${segundos} s.` };
  }
  return result.ok
    ? { aviso: "Te enviamos un código nuevo y un enlace nuevo." }
    : { error: "No pudimos reenviar el código." };
}

export async function entrarConEnlace(_prev: FormState, form: FormData): Promise<FormState> {
  const token = String(form.get("token") ?? "");
  const recordar = form.get("recordar") === "on";
  const result = await identity().consumeMagicLink(token, await clientInfo(), recordar);
  if (!result.ok)
    return { error: "Este enlace ya se usó o venció. Pide uno nuevo desde el inicio de sesión." };
  await startSession(result.value, recordar);
  redirect("/");
}

export async function entrarConGoogle(): Promise<FormState> {
  const result = await identity().signInWithGoogle(await clientInfo());
  if (!result.ok) return { error: "Google no confirmó una cuenta @ufm.edu verificada." };
  await startSession(result.value, false);
  redirect("/");
}

export async function entrarConPasskey(): Promise<FormState> {
  const deviceId = (await cookies()).get(DEVICE_COOKIE)?.value;
  const result = await identity().signInWithPasskey(deviceId, await clientInfo());
  if (!result.ok) {
    return {
      error:
        "Este dispositivo aún no tiene una passkey. Entra con tu correo y regístrala en Dispositivos.",
    };
  }
  await startSession(result.value, true);
  redirect("/");
}

export async function cerrarSesion() {
  await endSession();
  redirect("/login");
}
