"use server";

import { z } from "zod";

import { can } from "@/authz";
import { subjectFor } from "@/authz/subject";
import { academic } from "@/modules/academic";
import { requireActor } from "@/modules/identity/session";

import { publicar } from "../por-calificar/actions";

export type PublishState = { error?: string; ok?: string };

const Target = z.object({ sectionId: z.string().min(1), activityId: z.string().min(1) });

/**
 * Publish what is saved for one activity from the review screen. The course comes from the actor's
 * own sections, never from the form, and the same action as the batch does the work (and the audit).
 */
export async function publicarActividad(
  _prev: PublishState,
  form: FormData,
): Promise<PublishState> {
  const target = Target.safeParse(Object.fromEntries(form));
  if (!target.success) return { error: "No se pudo identificar la actividad." };
  const actor = await requireActor();
  const sections = await academic().listTeachingSections(actor);
  const section = sections.ok
    ? sections.value.find((s) => s.sectionId === target.data.sectionId)
    : undefined;
  if (
    !section ||
    !can(await subjectFor(actor), "publish_grades", {
      sectionId: section.sectionId,
      courseId: section.courseId,
    })
  )
    return { error: "No tienes asignada esta sección." };
  const res = await publicar(section.courseId, target.data.sectionId, target.data.activityId);
  if (!res.ok) return { error: res.error };
  return {
    ok: `Publicaste ${res.publicadas} ${res.publicadas === 1 ? "nota" : "notas"}. Los estudiantes ya recibieron el aviso.`,
  };
}
