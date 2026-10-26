import { describe, expect, it } from "vitest";

import { admin, auxiliar, maestro, student, value } from "@/test/actors";

import { academic } from ".";
import { MockAcademic } from "./adapters/mock/mock-academic";
import { createRealAcademic } from "./adapters/real/real-academic";

const port = new MockAcademic();

describe("AcademicPort (mock)", () => {
  it("getTerm: week 12 of 18 of 2026-2", async () => {
    const term = value(await port.getTerm());
    expect(term).toMatchObject({ id: "2026-2", semanas: 18, inicio: "2026-08-03" });
  });

  it("listCurrentEnrollments: the student's four courses, each with its section", async () => {
    const courses = value(await port.listCurrentEnrollments(student()));
    expect(courses.map((c) => [c.corto, c.seccion, c.slot])).toEqual([
      ["Discreta", "A", 1],
      ["Paradigmas", "A", 2],
      ["Ética", "C", 3],
      ["Bases de Datos", "B", 4],
    ]);
    expect(value(await port.listCurrentEnrollments(maestro()))).toEqual([]);
  });

  it("getCourse: own course, forbidden elsewhere, not_found when unknown", async () => {
    const md = value(await port.getCourse(student(), "matematica-discreta"));
    expect(md.catedratico.nombre).toBe("Jorge Castillo");
    expect(md.auxiliares.map((a) => a.nombre)).toEqual(["Sofía Ramírez"]);
    const asAux = await port.getCourse(auxiliar("p-sofia"), "bases-de-datos-1");
    expect(asAux).toMatchObject({ ok: false, error: "forbidden" });
    expect(await port.getCourse(student(), "astrofisica")).toMatchObject({
      ok: false,
      error: "not_found",
    });
  });

  it("getSchedule: ten weekly slots, Thursday has Discreta, Paradigmas and Ética", async () => {
    const slots = value(await port.getSchedule(student()));
    expect(slots).toHaveLength(10);
    expect(slots.filter((s) => s.dia === 4).map((s) => s.corto)).toEqual([
      "Discreta",
      "Paradigmas",
      "Ética",
    ]);
  });

  it("listPastEnrollments: four terms of five courses", async () => {
    const past = value(await port.listPastEnrollments(student()));
    expect(past).toHaveLength(20);
    expect(new Set(past.map((p) => p.periodo))).toEqual(
      new Set(["2024-2", "2025-1", "2025-2", "2026-1"]),
    );
  });

  it("listAnnouncements: newest first, only from the actor's courses", async () => {
    const list = value(await port.listAnnouncements(student()));
    expect(list[0]!.titulo).toBe("Notas de la Actividad 5 publicadas");
    expect(list.every((a, i) => i === 0 || list[i - 1]!.fecha >= a.fecha)).toBe(true);
    expect(await port.listAnnouncements(maestro(), "etica-de-la-libertad")).toMatchObject({
      ok: false,
      error: "forbidden",
    });
  });

  it("listDocuments: course files newest first", async () => {
    const docs = value(await port.listDocuments(student(), "matematica-discreta"));
    expect(docs[0]!.titulo).toBe("Guía de repaso del Parcial 2");
  });

  it("getSubsection: disabled is not the same as empty", async () => {
    expect(value(await port.getSubsection(student(), "matematica-discreta", "blog"))).toEqual({
      estado: "deshabilitada",
    });
    expect(value(await port.getSubsection(student(), "etica-de-la-libertad", "enlaces"))).toEqual({
      estado: "habilitada",
      items: [],
    });
    const people = value(
      await port.getSubsection(student(), "paradigmas-de-programacion", "personas"),
    );
    expect(people.estado === "habilitada" && people.items.map((i) => i.titulo)).toEqual([
      "Andrés Molina",
      "Carlos Méndez",
    ]);
    expect(await port.getSubsection(student(), "matematica-discreta", "actividades")).toMatchObject(
      {
        ok: false,
        error: "not_found",
      },
    );
  });

  it("listTeachingSections: owner and assistant see their own sections", async () => {
    const jorge = value(await port.listTeachingSections(maestro()));
    expect(jorge.map((s) => [s.sectionId, s.rol])).toEqual([
      ["md-a", "catedratico"],
      ["md-b", "catedratico"],
    ]);
    const carlos = value(await port.listTeachingSections(auxiliar()));
    expect(carlos.map((s) => [s.sectionId, s.rol])).toEqual([
      ["md-b", "auxiliar"],
      ["pp-a", "auxiliar"],
    ]);
  });

  it("getRoster: masked for teaching roles, closed to students and to other sections", async () => {
    const roster = value(await port.getRoster(auxiliar(), "pp-a"));
    expect(roster).toHaveLength(24);
    expect(roster[0]!.carne).toMatch(/^\d{4}-••\d{2}$/);
    expect(roster[0]!.correo).toMatch(/^.•••@ufm\.edu$/);
    expect(await port.getRoster(auxiliar(), "md-a")).toMatchObject({
      ok: false,
      error: "forbidden",
    });
    expect(await port.getRoster(student(), "md-a")).toMatchObject({
      ok: false,
      error: "forbidden",
    });
    expect(value(await port.getRoster(admin(), "md-a"))[0]!.carne).not.toContain("•");
  });

  it("listCoursePeople: teachers and assistants of the student's courses, once each", async () => {
    const people = value(await port.listCoursePeople(student()));
    expect(people.map((p) => p.nombre)).toContain("Lucía Herrera");
    expect(new Set(people.map((p) => p.id)).size).toBe(people.length);
  });
});

describe("AcademicPort selection", () => {
  it("defaults to the mock and every call is time-boxed", async () => {
    expect(value(await academic().getTerm()).id).toBe("2026-2");
  });

  it("the real adapter answers unavailable until it is connected", async () => {
    expect(await createRealAcademic().getTerm()).toMatchObject({ ok: false, error: "unavailable" });
  });
});
