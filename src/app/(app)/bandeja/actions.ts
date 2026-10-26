"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireActor } from "@/modules/identity/session";
import { inbox } from "@/modules/inbox";

const Id = z.string().min(1).max(200);

/** Marks one notice as read; it leaves the Bandeja and the bell together. */
export async function marcarLeido(itemId: string) {
  const id = Id.safeParse(itemId);
  if (!id.success) return { ok: false as const };
  const actor = await requireActor();
  const result = await inbox().markRead(actor, id.data);
  revalidatePath("/", "layout");
  return result.ok ? { ok: true as const, total: result.value.total } : { ok: false as const };
}

export async function marcarTodoLeido() {
  const actor = await requireActor();
  const result = await inbox().markAllRead(actor);
  revalidatePath("/", "layout");
  return result.ok ? { ok: true as const, total: result.value.total } : { ok: false as const };
}

/** Form versions (work without JavaScript): <form action={leerAviso}> with a hidden `id`. */
export async function leerAviso(form: FormData) {
  await marcarLeido(String(form.get("id") ?? ""));
}

export async function leerTodo() {
  await marcarTodoLeido();
}
