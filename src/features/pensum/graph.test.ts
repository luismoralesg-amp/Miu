import { describe, expect, it } from "vitest";

import { MockCurriculum } from "@/modules/curriculum/adapters/mock/mock-curriculum";
import { student, value } from "@/test/actors";

import { bySemester, relations } from "./graph";

describe("pensum graph", () => {
  it("selecting Paradigmas lights what it needs and what it opens", async () => {
    const { cursos } = value(await new MockCurriculum().getPensum(student()));
    const { rel, directos } = relations(cursos, "CC-501");
    expect(rel.get("CC-501")).toBe("seleccionado");
    expect(["CC-301", "CC-201", "CC-101"].every((c) => rel.get(c) === "requisito")).toBe(true);
    expect(rel.get("CC-602")).toBe("abre");
    expect(rel.get("HUM-101")).toBeUndefined();
    expect(directos).toEqual({ requisitos: ["CC-301"], abre: ["CC-602"] });
  });

  it("nothing selected, nothing lit; columns by semester", async () => {
    const { cursos } = value(await new MockCurriculum().getPensum(student()));
    expect(relations(cursos, null).rel.size).toBe(0);
    expect(bySemester(cursos).map((s) => s.cursos.length)).toEqual([5, 5, 5, 5, 5, 5, 5, 5]);
  });
});
