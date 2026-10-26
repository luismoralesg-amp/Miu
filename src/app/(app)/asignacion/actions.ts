"use server";

import { revalidatePath } from "next/cache";

import { can } from "@/authz";
import { subjectFor } from "@/authz/subject";
import { enrollment, type Preference } from "@/modules/enrollment";
import { devToolsEnabled, requireActor } from "@/modules/identity/session";

/** Step-up: a fresh code to confirm a sensitive change. In development the code is shown on screen. */
export async function pedirCodigo() {
  const actor = await requireActor();
  const r = await enrollment().requestStepUp(actor);
  if (!r.ok)
    return { ok: false as const, error: "No pudimos enviar el código. Inténtalo de nuevo." };
  return {
    ok: true as const,
    expira: r.value.expira,
    ...(devToolsEnabled() && r.value.codigoPrueba ? { codigoPrueba: r.value.codigoPrueba } : {}),
  };
}

export async function guardarPreferencias(prefs: Preference[], codigo: string) {
  const actor = await requireActor();
  if (!can(await subjectFor(actor), "set_enrollment_preferences", { ownerId: actor.personId }))
    return { error: "Tu rol no asigna cursos." };
  const r = await enrollment().savePreferences(actor, prefs, codigo);
  if (!r.ok) return { error: r.detail ?? "No se pudieron guardar. Inténtalo de nuevo." };
  revalidatePath("/asignacion");
  return { guardadas: r.value.guardadas };
}

export async function botarCurso(courseId: string, codigo: string) {
  const actor = await requireActor();
  if (!can(await subjectFor(actor), "set_enrollment_preferences", { ownerId: actor.personId }))
    return { error: "Tu rol no asigna cursos." };
  const r = await enrollment().drop(actor, courseId, codigo);
  if (!r.ok) return { error: r.detail ?? "No se pudo botar. Inténtalo de nuevo." };
  revalidatePath("/asignacion");
  return { ok: true as const };
}
