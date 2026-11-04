"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { can } from "@/authz";
import { subjectFor } from "@/authz/subject";
import { academic } from "@/modules/academic";
import { assessment, closeReadiness } from "@/modules/assessment";
import { audit } from "@/modules/audit";
import { requireActor } from "@/modules/identity/session";

export type CloseState = { error?: string; ok?: string };

const Target = z.object({ sectionId: z.string().min(1), confirmo: z.string().optional() });

/**
 * Close a section's final grade. Only whoever holds `close_final_grade` for that section (the Maestro
 * by default [S]); it can't close with grades left to give or publish, and activities that haven't
 * happened yet need an explicit confirmation. The close is audited.
 */
export async function cerrarNotaFinal(_prev: CloseState, form: FormData): Promise<CloseState> {
  const target = Target.safeParse(Object.fromEntries(form));
  if (!target.success) return { error: "No se pudo identificar la sección." };
  const actor = await requireActor();
  const sections = await academic().listTeachingSections(actor);
  const section = sections.ok
    ? sections.value.find((s) => s.sectionId === target.data.sectionId)
    : undefined;
  if (
    !section ||
    !can(await subjectFor(actor), "close_final_grade", {
      sectionId: section.sectionId,
      courseId: section.courseId,
    })
  )
    return { error: "Tu rol no puede cerrar la nota final de esta sección." };

  const book = await assessment().getSectionGradebook(actor, section.sectionId);
  if (!book.ok) return { error: "No se pudieron leer las notas. Inténtalo de nuevo." };
  const { listo, programadas } = closeReadiness(book.value.actividades);
  if (!listo) return { error: "Aún hay actividades por calificar o publicar." };
  if (programadas.length > 0 && target.data.confirmo !== "on")
    return { error: "Confirma que las actividades que aún no ocurren no contarán." };

  const result = await assessment().closeFinalGrade(actor, section.sectionId);
  if (!result.ok)
    return {
      error:
        result.error === "invalid" && result.detail
          ? result.detail
          : "No se pudo cerrar. Inténtalo de nuevo.",
    };
  await audit().record(actor, {
    accion: "cerrar_nota_final",
    recurso: section.sectionId,
    sectionId: section.sectionId,
    detalle: `Cerró la nota final de ${section.nombre} · ${section.seccion}: ${book.value.estudiantes.length} estudiantes, promedio ${book.value.promedio.toFixed(1)}`,
    despues: "cerrada",
  });
  revalidatePath("/", "layout");
  return { ok: "Nota final cerrada. Ya no se puede calificar ni publicar en esta sección." };
}
