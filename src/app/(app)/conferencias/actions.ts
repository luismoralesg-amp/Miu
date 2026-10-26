"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { conferences } from "@/modules/conferences";
import { requireActor } from "@/modules/identity/session";

export async function reservar(id: string) {
  const actor = await requireActor();
  await conferences().reserve(actor, id);
  revalidatePath("/conferencias", "layout");
}

export async function cancelarReserva(id: string) {
  const actor = await requireActor();
  await conferences().cancel(actor, id);
  revalidatePath("/conferencias", "layout");
}

export type EvalState = { error?: string };

export async function evaluar(id: string, _prev: EvalState, form: FormData): Promise<EvalState> {
  const actor = await requireActor();
  const calificacion = Number(form.get("calificacion"));
  if (!calificacion) return { error: "Elige una calificación de 1 a 5." };
  const result = await conferences().submitEvaluation(actor, id, {
    calificacion,
    comentario: String(form.get("comentario") ?? ""),
  });
  if (!result.ok) return { error: result.detail ?? "No se pudo enviar. Inténtalo de nuevo." };
  revalidatePath("/conferencias", "layout");
  redirect("/conferencias/mis-reservas?evaluada=1" as never);
}
