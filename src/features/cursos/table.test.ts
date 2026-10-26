import { describe, expect, it } from "vitest";

import { at } from "@/mock/seed";
import { MockAcademic } from "@/modules/academic/adapters/mock/mock-academic";
import { MockAssessment } from "@/modules/assessment/adapters/mock/mock-assessment";
import { student, value } from "@/test/actors";

import { filterCourses, groupCourses, scheduleLabel, sortCourses, toRows } from "./table";

async function rows() {
  const now = new Date(at(0, "07:42"));
  const ana = student();
  const assess = new MockAssessment(undefined, () => now);
  return toRows(
    value(await new MockAcademic().listCurrentEnrollments(ana)),
    value(await assess.getGradebook(ana)).cursos,
    value(await assess.listActivities(ana)),
    now,
  );
}

describe("Cursos table", () => {
  it("rows carry the grade so far and the next thing due", async () => {
    const r = await rows();
    expect(r.find((x) => x.corto === "Discreta")).toMatchObject({
      nota: 77.7,
      proxima: { titulo: "Parcial 2" },
      horario: "Lun, mié y jue · 07:00–08:20",
    });
    expect(scheduleLabel({ dias: [2], ini: "09:00", fin: "10:20", salon: "x" })).toBe(
      "Mar · 09:00–10:20",
    );
  });

  it("search ignores accents and case, and every word must match", async () => {
    const r = await rows();
    expect(filterCourses(r, "etica").map((x) => x.corto)).toEqual(["Ética"]);
    expect(filterCourses(r, "MENDEZ").map((x) => x.corto)).toEqual(["Paradigmas"]);
    expect(filterCourses(r, "sección b").map((x) => x.corto)).toEqual(["Bases de Datos"]);
    expect(filterCourses(r, "discreta castillo")).toHaveLength(1);
    expect(filterCourses(r, "discreta molina")).toHaveLength(0);
    expect(filterCourses(r, "   ")).toHaveLength(4);
  });

  it("sorts by name, grade, next deadline and credits", async () => {
    const r = await rows();
    expect(sortCourses(r, "nombre").map((x) => x.corto)).toEqual([
      "Bases de Datos",
      "Ética",
      "Discreta",
      "Paradigmas",
    ]);
    expect(sortCourses(r, "nota").map((x) => x.nota)).toEqual([91, 87, 84, 77.7]);
    expect(sortCourses(r, "proxima")[0]!.corto).toBe("Discreta");
    expect(sortCourses(r, "creditos").at(-1)!.corto).toBe("Ética");
  });

  it("groups by faculty and term", async () => {
    const groups = groupCourses(sortCourses(await rows(), "nombre"));
    expect(groups.map((g) => [g.facultad, g.periodo, g.rows.length])).toEqual([
      ["Ciencias de la Computación", "2026-2", 3],
      ["Estudios Generales", "2026-2", 1],
    ]);
  });
});
