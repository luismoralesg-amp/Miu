"use server";

import { revalidatePath } from "next/cache";

import { can } from "@/authz";
import { subjectFor } from "@/authz/subject";
import { audit } from "@/modules/audit";
import { requireActor } from "@/modules/identity/session";
import type { PolicyValues } from "@/modules/policy";
import { policy } from "@/modules/policy";

export type PolicyState = { error?: string; ok?: string };

const num = (form: FormData, name: string) => {
  const raw = String(form.get(name) ?? "").trim();
  return raw === "" ? NaN : Number(raw);
};

const describe = (v: PolicyValues) =>
  `umbral ${v.umbralJustificacion}; metas ${v.metas.join("/")}; tarjeta ${v.comisionTarjeta.porcentaje}% + Q${v.comisionTarjeta.fijo} (${v.comisionTarjeta.pagador})`;

/** Save the institutional policy. Validated by the port; every change records before and after. */
export async function guardarPolitica(_prev: PolicyState, form: FormData): Promise<PolicyState> {
  const actor = await requireActor();
  if (!can(await subjectFor(actor), "configure_policy", {}))
    return { error: "Tu rol no puede cambiar las políticas." };
  const next = {
    umbralJustificacion: num(form, "umbral"),
    metas: [num(form, "meta1"), num(form, "meta2"), num(form, "meta3")],
    comisionTarjeta: {
      porcentaje: num(form, "porcentaje"),
      fijo: num(form, "fijo"),
      pagador: form.get("pagador"),
    },
  };
  if (
    [
      next.umbralJustificacion,
      ...next.metas,
      next.comisionTarjeta.porcentaje,
      next.comisionTarjeta.fijo,
    ].some(Number.isNaN)
  )
    return { error: "Completa todos los valores con números." };
  const before = await policy().get(actor);
  const result = await policy().update(actor, next);
  if (!result.ok)
    return {
      error:
        result.error === "invalid" && result.detail
          ? result.detail
          : "No se pudo guardar. Inténtalo de nuevo.",
    };
  await audit().record(actor, {
    accion: "politica",
    recurso: "politicas",
    detalle: "Cambió las políticas institucionales",
    ...(before.ok ? { antes: describe(before.value) } : {}),
    despues: describe(result.value),
  });
  revalidatePath("/", "layout");
  return { ok: "Guardado. Se aplica de inmediato y queda en la auditoría." };
}
