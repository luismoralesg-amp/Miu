"use server";

import { revalidatePath } from "next/cache";

import { can } from "@/authz";
import { subjectFor } from "@/authz/subject";
import { assessment, type BatchEntry } from "@/modules/assessment";
import { audit } from "@/modules/audit";
import { requireActor } from "@/modules/identity/session";

export type GradeResult = { ok: true; entry: BatchEntry } | { ok: false; error: string };

/**
 * Save one grade. Scope is checked first (the Auxiliar only grades assigned sections), the rule
 * (justification under the threshold) is enforced by the port, and every saved grade is audited.
 */
export async function calificar({
  courseId,
  ...input
}: {
  courseId: string;
  sectionId: string;
  activityId: string;
  studentId: string;
  nota: number;
  justificacion?: string;
}): Promise<GradeResult> {
  const actor = await requireActor();
  // The port enforces the assignment again; this is the authorization check of the action itself.
  if (!can(await subjectFor(actor), "grade", { sectionId: input.sectionId, courseId }))
    return { ok: false, error: "No tienes asignada esta sección." };
  if (!Number.isInteger(input.nota) || input.nota < 0 || input.nota > 100)
    return { ok: false, error: "La nota va de 0 a 100." };
  const result = await assessment().gradeSubmission(actor, input);
  if (!result.ok)
    return {
      ok: false,
      error:
        result.error === "invalid" && result.detail
          ? result.detail
          : "No se pudo guardar. Inténtalo de nuevo.",
    };
  await audit().record(actor, {
    accion: "calificar",
    recurso: `${input.activityId}/${input.studentId}`,
    sectionId: input.sectionId,
    detalle: `Nota ${input.nota} para ${result.value.nombre}`,
    despues: String(input.nota),
    ...(result.value.justificacion ? { motivo: result.value.justificacion } : {}),
  });
  return { ok: true, entry: result.value };
}

export async function publicar(courseId: string, sectionId: string, activityId: string) {
  const actor = await requireActor();
  if (!can(await subjectFor(actor), "publish_grades", { sectionId, courseId }))
    return { ok: false as const, error: "No tienes asignada esta sección." };
  const result = await assessment().publishGrades(actor, sectionId, activityId);
  if (!result.ok)
    return { ok: false as const, error: "No se pudieron publicar. Inténtalo de nuevo." };
  await audit().record(actor, {
    accion: "publicar",
    recurso: activityId,
    sectionId,
    detalle: `${result.value.publicadas} notas publicadas`,
  });
  revalidatePath("/", "layout");
  return { ok: true as const, publicadas: result.value.publicadas };
}
