import { describe, expect, it } from "vitest";

import { PENSUM } from "@/mock/seed";
import { maestro, student, value } from "@/test/actors";

import { MockCurriculum } from "./adapters/mock/mock-curriculum";
import { createRealCurriculum } from "./adapters/real/real-curriculum";
import { prerequisiteChain, statusOf, unlocks } from "./domain/rules";

describe("pensum rules", () => {
  const course = { codigo: "X", prerrequisitos: ["A", "B"] };
  it("statusOf: approved, in progress, available or blocked", () => {
    expect(statusOf(course, new Set(["X"]), new Set())).toBe("aprobado");
    expect(statusOf(course, new Set(), new Set(["X"]))).toBe("en_curso");
    expect(statusOf(course, new Set(["A", "B"]), new Set())).toBe("disponible");
    expect(statusOf(course, new Set(["A"]), new Set(["B"]))).toBe("bloqueado");
  });

  it("prerequisiteChain: Compiladores needs the whole path behind it", () => {
    expect(prerequisiteChain("CC-602", PENSUM).sort()).toEqual(
      ["CC-101", "CC-201", "CC-301", "CC-501", "MAT-101", "MAT-102", "MAT-202", "MAT-501"].sort(),
    );
    expect(prerequisiteChain("MAT-101", PENSUM)).toEqual([]);
  });

  it("unlocks: what Estructuras de datos opens", () => {
    expect(unlocks("CC-301", PENSUM)).toEqual(
      expect.arrayContaining(["CC-401", "CC-501", "CC-502", "CC-602", "CC-801"]),
    );
  });
});

describe("CurriculumPort (mock)", () => {
  it("getPensum: progress after four terms", async () => {
    const p = value(await new MockCurriculum().getPensum(student()));
    expect(p.cursos).toHaveLength(40);
    expect(p.avance).toMatchObject({ aprobados: 20, enCurso: 4, total: 40 });
    const by = Object.fromEntries(p.cursos.map((c) => [c.codigo, c.estado]));
    expect(by).toMatchObject({
      "CC-301": "aprobado",
      "MAT-501": "en_curso",
      "CC-503": "disponible",
      "CC-601": "bloqueado",
    });
    expect(p.cursos.find((c) => c.codigo === "CC-101")).toMatchObject({
      nota: 84,
      periodo: "2024-2",
    });
  });

  it("getPensum: only for students; the real adapter is unavailable", async () => {
    expect(await new MockCurriculum().getPensum(maestro())).toMatchObject({ error: "forbidden" });
    expect(await createRealCurriculum().getPensum(student())).toMatchObject({
      error: "unavailable",
    });
  });
});
