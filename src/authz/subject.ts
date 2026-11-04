import { academic } from "@/modules/academic";
import type { Actor } from "@/modules/identity";
import { closeGrantSections } from "@/modules/policy";

import type { Subject } from "./can";

/**
 * The authorization subject behind an actor: their sections and courses this term, from the
 * academic port (enrolled sections for students, owned courses for the Maestro, assigned sections
 * for the Auxiliar). If the port is down the subject has no scope, so `can()` denies.
 */
export async function subjectFor(actor: Actor): Promise<Subject> {
  const base: Subject = { role: actor.role, personId: actor.personId };
  if (actor.role === "estudiante") {
    const enrolled = await academic().listCurrentEnrollments(actor);
    if (!enrolled.ok) return base;
    return {
      ...base,
      sectionIds: enrolled.value.map((c) => c.sectionId),
      courseIds: enrolled.value.map((c) => c.id),
    };
  }
  if (actor.role === "maestro" || actor.role === "auxiliar") {
    const sections = await academic().listTeachingSections(actor);
    if (!sections.ok) return base;
    return {
      ...base,
      sectionIds: sections.value.map((s) => s.sectionId),
      courseIds:
        actor.role === "maestro" ? [...new Set(sections.value.map((s) => s.courseId))] : [],
      // What the Administrativo granted this Auxiliar per section (closing the final grade).
      grants: closeGrantSections(actor).map((sectionId) => ({
        permission: "close_final_grade" as const,
        sectionId,
      })),
    };
  }
  return base;
}
