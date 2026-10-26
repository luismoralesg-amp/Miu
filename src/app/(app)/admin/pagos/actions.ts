"use server";

import { revalidatePath } from "next/cache";

import { can } from "@/authz";
import { subjectFor } from "@/authz/subject";
import { audit } from "@/modules/audit";
import { ledger } from "@/modules/finance";
import { requireActor } from "@/modules/identity/session";

export type ReviewState = { error?: string; ok?: string };

/** Approve or reject a transfer receipt. Only the Administrativo; rejecting needs a reason. */
export async function revisarTransferencia(
  transferId: string,
  _prev: ReviewState,
  form: FormData,
): Promise<ReviewState> {
  const actor = await requireActor();
  if (!can(await subjectFor(actor), "approve_payment", {}))
    return { error: "Tu rol no puede aprobar pagos." };
  const aprobar = form.get("decision") === "aprobar";
  const motivo = String(form.get("motivo") ?? "").trim();
  if (!aprobar && motivo.length < 5)
    return { error: "Escribe el motivo del rechazo; la estudiante lo verá." };
  const result = await ledger().reviewTransfer(
    actor,
    transferId,
    aprobar ? { aprobar } : { aprobar, motivo },
  );
  if (!result.ok)
    return {
      error:
        result.error === "invalid" && result.detail
          ? result.detail
          : "No se pudo guardar. Inténtalo de nuevo.",
    };
  await audit().record(actor, {
    accion: aprobar ? "aprobar_pago" : "rechazar_pago",
    recurso: transferId,
    detalle: `${aprobar ? "Aprobó" : "Rechazó"} ${result.value.concepto} de ${result.value.alumno} (boleta ${result.value.boleta})`,
    ...(motivo ? { motivo } : {}),
  });
  revalidatePath("/", "layout");
  return {
    ok: aprobar
      ? "Aprobada. El pago quedó registrado y la estudiante ya está solvente."
      : "Rechazada. La estudiante verá el motivo.",
  };
}
