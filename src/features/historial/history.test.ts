import { describe, expect, it } from "vitest";

import { MockAcademic } from "@/modules/academic/adapters/mock/mock-academic";
import { student, value } from "@/test/actors";

import { groupByTerm, searchHistory } from "./history";

describe("Historial", () => {
  it("groups by term, newest first, with each term's average", async () => {
    const past = value(await new MockAcademic().listPastEnrollments(student()));
    const g = groupByTerm(past);
    expect(g.map((t) => [t.periodo, t.promedio])).toEqual([
      ["2026-1", 83.8],
      ["2025-2", 83],
      ["2025-1", 82.2],
      ["2024-2", 80.6],
    ]);
  });

  it("one search finds by name, code or term, without accents", async () => {
    const past = value(await new MockAcademic().listPastEnrollments(student()));
    expect(searchHistory(past, "calculo").map((c) => c.codigo)).toEqual(["MAT-101", "MAT-201"]);
    expect(searchHistory(past, "cc-40").map((c) => c.nombre)).toEqual([
      "Algoritmos",
      "Sistemas operativos",
      "Ingeniería de software I",
    ]);
    expect(searchHistory(past, "2024-2")).toHaveLength(5);
  });
});
