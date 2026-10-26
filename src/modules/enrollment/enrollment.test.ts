import { describe, expect, it } from "vitest";

import { at } from "@/mock/seed";
import { maestro, student, value } from "@/test/actors";

import { MockEnrollment } from "./adapters/mock/mock-enrollment";
import { createRealEnrollment } from "./adapters/real/real-enrollment";
import { checkPreferences, isValid, overlaps } from "./domain/rules";

const now = () => new Date(at(0, "07:42"));

describe("assignment rules", () => {
  it("detects overlapping sections only on shared days", () => {
    expect(
      overlaps(
        { dias: [1, 3], ini: "07:00", fin: "08:20" },
        { dias: [3], ini: "08:00", fin: "09:00" },
      ),
    ).toBe(true);
    expect(
      overlaps(
        { dias: [1, 3], ini: "07:00", fin: "08:20" },
        { dias: [2], ini: "07:00", fin: "08:20" },
      ),
    ).toBe(false);
    expect(
      overlaps(
        { dias: [1], ini: "07:00", fin: "08:20" },
        { dias: [1], ini: "08:20", fin: "09:00" },
      ),
    ).toBe(false);
  });

  it("checks the credit cap, clashes and missing sections", async () => {
    const offer = value(await new MockEnrollment(undefined, now).listOffer(student()));
    const a = offer[0]!;
    const b = offer.find(
      (c) => c.secciones.some((s) => overlaps(s, a.secciones[0]!)) && c.codigo !== a.codigo,
    )!;
    const clash = b.secciones.find((s) => overlaps(s, a.secciones[0]!))!;
    const check = checkPreferences(
      [
        { codigo: a.codigo, secciones: [a.secciones[0]!.id] },
        { codigo: b.codigo, secciones: [clash.id] },
      ],
      offer,
      24,
    );
    expect(check.choques).toEqual([[a.codigo, b.codigo]]);
    expect(isValid(check)).toBe(false);
    expect(
      checkPreferences([{ codigo: a.codigo, secciones: ["X"] }], offer, 24).faltaSeccion,
    ).toEqual([a.codigo]);
    expect(
      checkPreferences(
        offer.map((c) => ({ codigo: c.codigo, secciones: [c.secciones[0]!.id] })),
        offer,
        8,
      ).excede,
    ).toBe(true);
  });
});

describe("EnrollmentPort (mock)", () => {
  it("offers what the student can take; saving needs a fresh one-time code", async () => {
    const port = new MockEnrollment(undefined, now);
    const ana = student();
    expect(value(await port.getWindow(ana))).toMatchObject({
      periodo: "2027-1",
      estado: "abierta",
      maxUma: 24,
    });
    const offer = value(await port.listOffer(ana));
    expect(offer.map((c) => c.codigo)).toContain("CC-503");
    expect(offer.map((c) => c.codigo)).not.toContain("CC-601");
    const prefs = [
      { codigo: "CC-503", secciones: [offer.find((c) => c.codigo === "CC-503")!.secciones[0]!.id] },
    ];
    expect(await port.savePreferences(ana, prefs, "123456")).toMatchObject({ error: "invalid" });
    const { codigoPrueba } = value(await port.requestStepUp(ana));
    expect(await port.savePreferences(ana, prefs, "000000")).toMatchObject({
      error: "invalid",
      detail: "El código no coincide",
    });
    expect(value(await port.savePreferences(ana, prefs, codigoPrueba!)).guardadas).not.toBeNull();
    expect(await port.savePreferences(ana, prefs, codigoPrueba!)).toMatchObject({
      error: "invalid",
    });
  });

  it("dropping a current course also needs step-up; other roles are forbidden", async () => {
    const port = new MockEnrollment(undefined, now);
    const ana = student();
    const { codigoPrueba } = value(await port.requestStepUp(ana));
    expect(value(await port.drop(ana, "etica-de-la-libertad", codigoPrueba!))).toMatchObject({
      courseId: "etica-de-la-libertad",
    });
    expect(value(await port.listDropped(ana))).toEqual(["etica-de-la-libertad"]);
    expect(await port.getWindow(maestro())).toMatchObject({ error: "forbidden" });
    expect(await createRealEnrollment().getWindow(ana)).toMatchObject({ error: "unavailable" });
  });
});
