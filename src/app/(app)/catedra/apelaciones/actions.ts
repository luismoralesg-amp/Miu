"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { can } from "@/authz";
import { subjectFor } from "@/authz/subject";
import { assessment } from "@/modules/assessment";
import { audit } from "@/modules/audit";
import { requireActor } from "@/modules/identity/session";

export type AppealState = { error?: string; ok?: string };

const Form = z.object({
  accion: z.enum(["responder", "escalar", "resolver"]),
  respuesta: z.string().default(""),
  decision: z.enum(["mantiene", "modifica"]).optional(),
  notaNueva: z.string().optional(),
});

/**
 * Answer, escalate or resolve one appeal. Responding or escalating needs `respond_appeal` in the
 * appeal's section; resolving needs `resolve_appeal` (the Maestro of the course). The decision is
 * audited, including the new grade when it changes.
 */
export async function gestionarApelacion(
  appealId: string,
  _prev: AppealState,
  form: FormData,
): Promise<AppealState> {
  const parsed = Form.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "No se entendió la acción." };
  const { accion, respuesta, decision, notaNueva } = parsed.data;
  const actor = await requireActor();
  const list = await assessment().listAppeals(actor);
  const appeal = list.ok ? list.value.find((a) => a.id === appealId) : undefined;
  if (!appeal) return { error: "No encontramos esta apelación." };
  const resource = {
    sectionId: appeal.sectionId,
    courseId: appeal.curso.id,
    escalated: appeal.estado === "escalada",
  };
  const subject = await subjectFor(actor);
  const needed = accion === "resolver" ? "resolve_appeal" : "respond_appeal";
  if (!can(subject, needed, resource)) return { error: "Tu rol no puede hacer esto." };

  const result =
    accion === "resolver"
      ? await assessment().resolveAppeal(actor, appealId, {
          decision: decision ?? "mantiene",
          ...(decision === "modifica" && notaNueva?.trim() ? { notaNueva: Number(notaNueva) } : {}),
          respuesta,
        })
      : await assessment().replyAppeal(actor, appealId, {
          respuesta,
          escalar: accion === "escalar",
        });
  if (!result.ok)
    return {
      error:
        result.error === "invalid" && result.detail
          ? result.detail
          : "No se pudo guardar. Inténtalo de nuevo.",
    };
  const nueva = result.value.resolucion?.notaNueva;
  await audit().record(actor, {
    accion: nueva !== undefined ? "sobrescribir" : "apelacion",
    recurso: appealId,
    sectionId: appeal.sectionId,
    detalle: `${
      accion === "resolver" ? "Resolvió" : accion === "escalar" ? "Escaló" : "Respondió"
    } la apelación de ${appeal.estudiante.nombre} (${appeal.actividad})`,
    ...(nueva !== undefined && appeal.nota !== null
      ? { antes: String(appeal.nota), despues: String(nueva) }
      : {}),
    motivo: respuesta,
  });
  revalidatePath("/", "layout");
  return {
    ok:
      accion === "resolver"
        ? "Resuelta. La decisión quedó registrada."
        : accion === "escalar"
          ? "Escalada a la administración."
          : "Respondida.",
  };
}
