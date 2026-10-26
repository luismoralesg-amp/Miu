import { describe, expect, it } from "vitest";

import { at } from "@/mock/seed";
import { MockAssessment } from "@/modules/assessment/adapters/mock/mock-assessment";
import { student, value } from "@/test/actors";

import { courseBar, goals, gradeProfile, simulate } from "./model";

async function book() {
  return value(
    await new MockAssessment(undefined, () => new Date(at(0, "07:42"))).getGradebook(student()),
  );
}

describe("Notas", () => {
  it("term average 84.9, up 1.1 from 83.8, with the trend ending in the current term", async () => {
    const p = gradeProfile(await book());
    expect(p).toMatchObject({ promedio: 84.9, anterior: 83.8, delta: 1.1 });
    expect(p.serie.map((s) => s.periodo)).toEqual([
      "2024-2",
      "2025-1",
      "2025-2",
      "2026-1",
      "2026-2",
    ]);
    expect(p.serie.at(-1)).toEqual({ periodo: "2026-2", valor: 84.9, enCurso: true });
  });

  it("the course bar always adds up to 100", async () => {
    for (const c of (await book()).cursos) {
      const b = courseBar(c);
      expect(Math.round((b.obtenido + b.perdido + b.porEvaluar) * 10) / 10).toBe(100);
    }
    expect(courseBar({ evaluado: 60, obtenido: 46.6 })).toEqual({
      obtenido: 46.6,
      perdido: 13.4,
      porEvaluar: 40,
    });
  });

  it("goals for Discreta: 61 for 71, 84 for 80, 90 out of reach", () => {
    expect(goals({ evaluado: 60, obtenido: 46.6 }, [71, 80, 90])).toEqual([
      { meta: 71, necesita: 61, estado: "alcanzable" },
      { meta: 80, necesita: 84, estado: "alcanzable" },
      { meta: 90, necesita: 109, estado: "imposible" },
    ]);
    expect(goals({ evaluado: 90, obtenido: 80 }, [71])[0]!.estado).toBe("asegurada");
  });

  it("the simulator says what a grade on the rest means [S: 61 to pass, targets 71/80/90]", () => {
    const md = { evaluado: 60, obtenido: 46.6 };
    expect(simulate(md, 75, [71, 80, 90], 61)).toEqual({
      final: 77,
      nota: "Llegas a 71 y te faltan 3 para 80.",
    });
    expect(simulate(md, 100, [71, 80, 90], 61)).toEqual({
      final: 87,
      nota: "Llegas a 80 y te faltan 3 para 90.",
    });
    expect(simulate(md, 40, [71, 80, 90], 61).nota).toBe(
      "Apruebas, y te faltan 8 puntos para llegar a 71.",
    );
    expect(simulate({ evaluado: 60, obtenido: 20 }, 50, [71, 80, 90], 61).nota).toBe(
      "Quedarías bajo 61: te faltan 21 puntos para aprobar.",
    );
  });
});
