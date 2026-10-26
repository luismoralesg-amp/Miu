import { describe, expect, it } from "vitest";

import { roles, type Role } from "@/modules/identity";

import { can, roleCan, rulesFor, type Subject } from "./can";
import { permissions, type Permission, type Scope } from "./matrix";

/**
 * The matrix of docs/FUNCIONES_NUEVAS_Y_PAGOS.md §3, written out a second time on purpose: every cell
 * is a test, so changing a permission means changing both the table and this expectation.
 * Columns: administrativo, maestro, auxiliar, estudiante. "—" = no access.
 */
type Cell = Scope | "—";
const EXPECTED: Record<Permission, [Cell, Cell, Cell, Cell]> = {
  view_course: ["global", "course", "section", "own"],
  assign_assistant: ["global", "course", "—", "—"],
  manage_activities: ["—", "course", "section", "—"],
  grade: ["—", "course", "section", "—"],
  publish_grades: ["—", "course", "section", "—"],
  close_final_grade: ["—", "course", "—", "—"],
  override_grade: ["global", "course", "own", "—"],
  view_submissions: ["global", "course", "section", "own"],
  submit: ["—", "—", "—", "own"],
  view_roster: ["global", "course", "section", "—"],
  post_announcement: ["global", "course", "section", "—"],
  read_announcement: ["—", "—", "—", "own"],
  view_payments: ["global", "—", "—", "own"],
  pay: ["—", "—", "—", "own"],
  approve_payment: ["global", "—", "—", "—"],
  refund_payment: ["global", "—", "—", "—"],
  configure_enrollment: ["global", "—", "—", "—"],
  view_enrollment_policy: ["—", "course", "—", "—"],
  set_enrollment_preferences: ["—", "—", "—", "own"],
  view_grade_stats: ["global", "course", "section", "—"],
  create_appeal: ["—", "—", "—", "own"],
  respond_appeal: ["—", "course", "section", "—"],
  resolve_appeal: ["global", "course", "—", "—"],
  manage_reminders: ["global", "course", "section", "own"],
  view_audit: ["global", "course", "own", "own"],
  configure_policy: ["global", "—", "—", "—"],
  manage_roles: ["global", "—", "—", "—"],
  view_academic_record: ["—", "—", "—", "own"],
};
const COLUMNS: Role[] = ["administrativo", "maestro", "auxiliar", "estudiante"];

const cells = permissions.flatMap((permission) =>
  COLUMNS.map((role, i) => ({ permission, role, expected: EXPECTED[permission][i]! })),
);

describe("authorization matrix", () => {
  it("covers every permission and role", () => {
    expect(Object.keys(EXPECTED).sort()).toEqual([...permissions].sort());
    expect([...COLUMNS].sort()).toEqual([...roles].sort());
  });

  it.each(cells)("$role · $permission → $expected", ({ permission, role, expected }) => {
    const scopesFound = rulesFor(role, permission).map((r) => r.scope);
    expect(scopesFound).toEqual(expected === "—" ? [] : [expected]);
    expect(roleCan(role, permission)).toBe(expected !== "—");
  });
});

const maestro: Subject = {
  role: "maestro",
  personId: "p-jorge",
  courseIds: ["matematica-discreta"],
};
const auxiliar: Subject = { role: "auxiliar", personId: "p-carlos", sectionIds: ["md-b", "pp-a"] };
const estudiante: Subject = { role: "estudiante", personId: "p-ana", sectionIds: ["md-a"] };
const admin: Subject = { role: "administrativo", personId: "p-rodrigo" };

describe("scope", () => {
  it("a Maestro grades in their course and nowhere else", () => {
    expect(can(maestro, "grade", { courseId: "matematica-discreta", sectionId: "md-a" })).toBe(
      true,
    );
    expect(can(maestro, "grade", { courseId: "bases-de-datos-1", sectionId: "bd-b" })).toBe(false);
  });

  it("an Auxiliar only acts on assigned sections", () => {
    expect(can(auxiliar, "grade", { sectionId: "pp-a" })).toBe(true);
    expect(can(auxiliar, "grade", { sectionId: "md-a" })).toBe(false);
    expect(can(auxiliar, "view_roster", { sectionId: "md-b" })).toBe(true);
  });

  it("a student only reaches their own records", () => {
    expect(can(estudiante, "submit", { ownerId: "p-ana" })).toBe(true);
    expect(can(estudiante, "submit", { ownerId: "p-s001" })).toBe(false);
    expect(can(estudiante, "grade", { ownerId: "p-ana" })).toBe(false);
  });

  it("only the Maestro closes the final grade, unless the Administrativo grants it [S]", () => {
    expect(can(maestro, "close_final_grade", { courseId: "matematica-discreta" })).toBe(true);
    expect(can(auxiliar, "close_final_grade", { sectionId: "pp-a" })).toBe(false);
    const granted: Subject = {
      ...auxiliar,
      grants: [{ permission: "close_final_grade", sectionId: "pp-a" }],
    };
    expect(can(granted, "close_final_grade", { sectionId: "pp-a" })).toBe(true);
    expect(can(granted, "close_final_grade", { sectionId: "md-b" })).toBe(false);
  });

  it("the Administrativo overrides a grade only through an escalated appeal", () => {
    expect(can(admin, "override_grade", { sectionId: "md-a" })).toBe(false);
    expect(can(admin, "override_grade", { sectionId: "md-a", escalated: true })).toBe(true);
  });

  it("an Auxiliar changes only their own grades, and only before the close", () => {
    expect(can(auxiliar, "override_grade", { ownerId: "p-carlos" })).toBe(true);
    expect(can(auxiliar, "override_grade", { ownerId: "p-carlos", closed: true })).toBe(false);
    expect(can(auxiliar, "override_grade", { ownerId: "p-sofia" })).toBe(false);
  });

  it("without a resource it answers for the role (route guards)", () => {
    expect(can(auxiliar, "publish_grades")).toBe(true);
    expect(can(estudiante, "approve_payment")).toBe(false);
  });
});

describe("payments queue", () => {
  it("only the Administrativo approves or refunds; nobody else, in any scope", () => {
    for (const subject of [maestro, auxiliar, estudiante]) {
      expect(can(subject, "approve_payment", {})).toBe(false);
      expect(can(subject, "refund_payment", { ownerId: subject.personId })).toBe(false);
    }
    expect(can(admin, "approve_payment", {})).toBe(true);
    expect(can(admin, "refund_payment", {})).toBe(true);
  });
});
