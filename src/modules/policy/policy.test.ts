import { afterEach, describe, expect, it } from "vitest";

import { can } from "@/authz";
import { subjectFor } from "@/authz/subject";
import { at } from "@/mock/seed";
import { MockAssessment } from "@/modules/assessment/adapters/mock/mock-assessment";
import { MockRecurrente } from "@/modules/payments/adapters/mock/mock-recurrente";
import { admin, auxiliar, maestro, student, value } from "@/test/actors";

import { MockPolicy } from "./adapters/mock/mock-policy";
import { PolicyValues } from "./domain/types";
import { closeGrantSections, currentPolicy, resetPolicyState } from "./index";

afterEach(resetPolicyState);

const ok: PolicyValues = {
  umbralJustificacion: 65,
  metas: [75, 82, 92],
  comisionTarjeta: { porcentaje: 3.9, fijo: 2.5, pagador: "estudiante" },
};
/** The same person signed in under another role, as the role switcher does in development. */
const as = <T extends { userId: string }>(actor: T, other: { userId: string }): T => ({
  ...actor,
  userId: other.userId,
});

describe("policy values", () => {
  it.each([
    ["umbral 0", { ...ok, umbralJustificacion: 0 }],
    ["umbral 101", { ...ok, umbralJustificacion: 101 }],
    ["two goals", { ...ok, metas: [75, 82] }],
    ["goals out of order", { ...ok, metas: [82, 75, 92] }],
    ["first goal not above the threshold", { ...ok, metas: [65, 82, 92] }],
    ["negative fee", { ...ok, comisionTarjeta: { ...ok.comisionTarjeta, porcentaje: -1 } }],
    ["fee over 10%", { ...ok, comisionTarjeta: { ...ok.comisionTarjeta, porcentaje: 11 } }],
    ["fixed fee over Q50", { ...ok, comisionTarjeta: { ...ok.comisionTarjeta, fijo: 51 } }],
  ])("rejects %s", (_n, input) => {
    expect(PolicyValues.safeParse(input).success).toBe(false);
  });

  it("accepts a coherent policy", () => {
    expect(PolicyValues.safeParse(ok).success).toBe(true);
  });
});

describe("MockPolicy", () => {
  it("only the Administrativo changes it; everyone reads it", async () => {
    const port = new MockPolicy();
    expect(await port.update(maestro(), ok)).toMatchObject({ error: "forbidden" });
    expect(await port.update(auxiliar(), ok)).toMatchObject({ error: "forbidden" });
    expect(await port.update(student(), ok)).toMatchObject({ error: "forbidden" });
    expect(await port.update(admin(), { ...ok, metas: [1, 2] })).toMatchObject({
      error: "invalid",
    });
    expect(value(await port.get(student())).umbralJustificacion).toBe(61);
    expect(value(await port.update(admin(), ok))).toEqual(ok);
  });

  it("a test account's changes stay in that account; the demo accounts share them", async () => {
    const port = new MockPolicy();
    const a = admin();
    value(await port.update(a, ok));
    expect(value(await port.get(as(maestro(), a))).umbralJustificacion).toBe(65);
    expect(value(await port.get(maestro())).umbralJustificacion).toBe(61);
    const rodrigo = { ...admin(), userId: "u-rodrigo" };
    value(await port.update(rodrigo, { ...ok, umbralJustificacion: 70, metas: [75, 82, 92] }));
    expect(value(await port.get({ ...student(), userId: "u-ana" })).umbralJustificacion).toBe(70);
  });

  it("the threshold reaches grading: under the new one the justification is required", async () => {
    const a = admin();
    value(
      await new MockPolicy().update(a, { ...ok, umbralJustificacion: 70, metas: [75, 82, 92] }),
    );
    const jorge = as(maestro(), a);
    const port = new MockAssessment(undefined, () => new Date(at(0, "07:42")));
    expect(value(await port.listBatch(jorge, "md-b", "md-tarea-4")).umbral).toBe(70);
    const entry = value(await port.listBatch(jorge, "md-b", "md-tarea-4")).entradas[0]!;
    expect(
      await port.gradeSubmission(jorge, {
        sectionId: "md-b",
        activityId: "md-tarea-4",
        studentId: entry.studentId,
        nota: 68,
      }),
    ).toMatchObject({ error: "invalid", detail: "Bajo 70 la justificación es obligatoria" });
    // The same grade needs nothing under the default threshold.
    const other = maestro();
    expect(
      value(
        await port.gradeSubmission(other, {
          sectionId: "md-b",
          activityId: "md-tarea-4",
          studentId: entry.studentId,
          nota: 68,
        }),
      ).nota,
    ).toBe(68);
  });

  it("the card fee reaches payments", async () => {
    const rodrigo = { ...admin(), userId: "u-rodrigo" };
    value(await new MockPolicy().update(rodrigo, ok));
    expect(currentPolicy().comisionTarjeta.porcentaje).toBe(3.9);
    const quote = value(await new MockRecurrente().quote(1000, "tarjeta"));
    expect(quote.comision).toBe(41.5);
  });
});

describe("closing the final grade, granted per section", () => {
  it("lists every Auxiliar of every section; only the Administrativo grants", async () => {
    const port = new MockPolicy();
    const a = admin();
    const list = value(await port.listCloseGrants(a));
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((g) => !g.otorgado)).toBe(true);
    const target = list[0]!;
    const input = { personId: target.personId, sectionId: target.sectionId, otorgado: true };
    expect(await port.setCloseGrant(maestro(), input)).toMatchObject({ error: "forbidden" });
    expect(
      await port.setCloseGrant(a, {
        personId: "p-ana",
        sectionId: target.sectionId,
        otorgado: true,
      }),
    ).toMatchObject({ error: "not_found" });
    expect(value(await port.setCloseGrant(a, input)).otorgado).toBe(true);
    expect(value(await port.setCloseGrant(a, { ...input, otorgado: false })).otorgado).toBe(false);
  });

  it("an Auxiliar closes only after the grant, and only that section", async () => {
    const a = admin();
    const carlos = as(auxiliar(), a);
    const port = new MockAssessment(undefined, () => new Date(at(0, "07:42")));
    // Grade and publish the whole batch of md-b first: closing needs nothing pending.
    const batch = value(await port.listBatch(carlos, "md-b", "md-tarea-4"));
    for (const e of batch.entradas)
      value(
        await port.gradeSubmission(carlos, {
          sectionId: "md-b",
          activityId: "md-tarea-4",
          studentId: e.studentId,
          nota: 80,
        }),
      );
    value(await port.publishGrades(carlos, "md-b", "md-tarea-4"));

    expect(await port.closeFinalGrade(carlos, "md-b")).toMatchObject({ error: "forbidden" });
    expect(can(await subjectFor(carlos), "close_final_grade", { sectionId: "md-b" })).toBe(false);
    value(
      await new MockPolicy().setCloseGrant(a, {
        personId: "p-carlos",
        sectionId: "md-b",
        otorgado: true,
      }),
    );
    expect(closeGrantSections(carlos)).toEqual(["md-b"]);
    expect(can(await subjectFor(carlos), "close_final_grade", { sectionId: "md-b" })).toBe(true);
    expect(can(await subjectFor(carlos), "close_final_grade", { sectionId: "pp-a" })).toBe(false);
    expect(value(await port.closeFinalGrade(carlos, "md-b"))).toMatchObject({ cerrada: true });
  });
});
