"use server";

import { requireActor } from "@/modules/identity/session";
import { support, type Department } from "@/modules/support";

export async function abrirChat(departamento: Department, pantalla: string) {
  const actor = await requireActor();
  const r = await support().openSession(actor, { departamento, pantalla: pantalla.slice(0, 200) });
  return r.ok ? { session: r.value } : { error: r.detail ?? "No pudimos abrir el chat." };
}

export async function escribirSoporte(sessionId: string, texto: string) {
  const actor = await requireActor();
  const r = await support().send(actor, sessionId, texto);
  return r.ok ? { session: r.value } : { error: r.detail ?? "No se pudo enviar." };
}
