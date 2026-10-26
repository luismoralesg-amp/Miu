import type { Role } from "@/modules/identity";

import { MATRIX, type Condition, type Permission, type Rule } from "./matrix";

/** Who is asking: role plus what is assigned to them this term. */
export type Subject = {
  role: Role;
  personId: string;
  /** Courses the subject owns (Maestro). */
  courseIds?: readonly string[];
  /** Sections assigned to the subject (Auxiliar), or where the student is enrolled. */
  sectionIds?: readonly string[];
  facultyIds?: readonly string[];
  /** Permissions granted per section by the Administrativo, e.g. close_final_grade for an Auxiliar. */
  grants?: ReadonlyArray<{ permission: Permission; sectionId: string }>;
};

/** What is being touched. Omit it to ask "does this role hold the permission anywhere?" (routes). */
export type Resource = {
  courseId?: string;
  sectionId?: string;
  facultyId?: string;
  /** Person the record belongs to (a submission, a payment, a grade given by someone). */
  ownerId?: string;
  escalated?: boolean;
  closed?: boolean;
};

function inScope(rule: Rule, subject: Subject, resource: Resource): boolean {
  switch (rule.scope) {
    case "global":
      return true;
    case "faculty":
      return resource.facultyId !== undefined && !!subject.facultyIds?.includes(resource.facultyId);
    case "course":
      return resource.courseId !== undefined && !!subject.courseIds?.includes(resource.courseId);
    case "section":
      return resource.sectionId !== undefined && !!subject.sectionIds?.includes(resource.sectionId);
    case "own":
      return resource.ownerId !== undefined && resource.ownerId === subject.personId;
  }
}

function meets(when: Condition | undefined, resource: Resource): boolean {
  if (when === "escalated_appeal") return resource.escalated === true;
  if (when === "before_close") return resource.closed !== true;
  return true;
}

export function rulesFor(role: Role, permission: Permission): Rule[] {
  return MATRIX.filter((r) => r.role === role && r.permission === permission);
}

/**
 * The single authorization check. Every route and server action asks it before reading or writing.
 * Without a resource it answers for the role in general (to show a screen); with one, it applies the
 * scope and any condition (to touch a record).
 */
export function can(subject: Subject, permission: Permission, resource?: Resource): boolean {
  const granted = subject.grants?.some(
    (g) =>
      g.permission === permission && (resource === undefined || g.sectionId === resource.sectionId),
  );
  if (granted) return true;
  const rules = rulesFor(subject.role, permission);
  if (resource === undefined) return rules.length > 0;
  return rules.some((rule) => inScope(rule, subject, resource) && meets(rule.when, resource));
}

/** Role-only check for navigation and route guards. */
export function roleCan(role: Role, permission: Permission): boolean {
  return rulesFor(role, permission).length > 0;
}
