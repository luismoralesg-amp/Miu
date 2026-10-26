import { cache } from "react";
import { notFound } from "next/navigation";

import { withFault } from "@/lib/fault";
import { academic } from "@/modules/academic";
import { requireActor } from "@/modules/identity/session";

/**
 * The course behind /cursos/[cursoId], loaded once per request and shared by the layout and pages.
 * Unknown courses are a real 404; courses the actor is not in come back as `forbidden`.
 */
export const loadCourse = cache(async (cursoId: string) => {
  const actor = await requireActor();
  const course = await withFault("academic", () => academic().getCourse(actor, cursoId));
  if (!course.ok && course.error === "not_found") notFound();
  return { actor, course };
});
