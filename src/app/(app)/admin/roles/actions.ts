"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { can } from "@/authz";
import { subjectFor } from "@/authz/subject";
import { audit } from "@/modules/audit";
import { requireActor } from "@/modules/identity/session";
import { policy } from "@/modules/policy";

export type GrantState = { error?: string; ok?: string };

const Form = z.object({
  personId: z.string().min(1),
  sectionId: z.string().min(1),
  otorgar: z.enum(["si", "no"]),
});

/** Let an Auxiliar close the final grade of one section, or take it back. Audited. */
export async function otorgarCierre(_prev: GrantState, form: FormData): Promise<GrantState> {
  const body = Form.safeParse(Object.fromEntries(form));
  if (!body.success) return { error: "No se pudo identificar la sección." };
  const actor = await requireActor();
  if (!can(await subjectFor(actor), "manage_roles", {}))
    return { error: "Tu rol no puede gestionar roles." };
  const otorgado = body.data.otorgar === "si";
  const result = await policy().setCloseGrant(actor, {
    personId: body.data.personId,
    sectionId: body.data.sectionId,
    otorgado,
  });
  if (!result.ok) return { error: "No se pudo guardar. Inténtalo de nuevo." };
  await audit().record(actor, {
    accion: "rol",
    recurso: `${body.data.personId}/${body.data.sectionId}`,
    sectionId: body.data.sectionId,
    detalle: `${otorgado ? "Otorgó" : "Quitó"} a ${result.value.nombre} cerrar la nota final de ${result.value.curso} · ${result.value.seccion}`,
    antes: otorgado ? "sin permiso" : "puede cerrar",
    despues: otorgado ? "puede cerrar" : "sin permiso",
  });
  revalidatePath("/", "layout");
  return { ok: otorgado ? "Otorgado." : "Quitado." };
}
