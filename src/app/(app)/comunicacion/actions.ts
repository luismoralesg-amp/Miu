"use server";

import { revalidatePath } from "next/cache";

import { requireActor } from "@/modules/identity/session";
import { messaging } from "@/modules/messaging";

export type SendState = { error?: string; enviado?: number };

export async function enviarMensaje(
  personaId: string,
  _prev: SendState,
  form: FormData,
): Promise<SendState> {
  const actor = await requireActor();
  const r = await messaging().send(actor, personaId, String(form.get("texto") ?? ""));
  if (!r.ok)
    return {
      error: r.detail ?? "No se pudo enviar. Tu mensaje no se perdió: vuelve a intentarlo.",
    };
  revalidatePath("/comunicacion");
  return { enviado: Date.now() };
}
