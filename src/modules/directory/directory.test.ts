import { describe, expect, it } from "vitest";

import { student, value } from "@/test/actors";

import { MockDirectory } from "./adapters/mock/mock-directory";
import { createRealDirectory } from "./adapters/real/real-directory";

describe("DirectoryPort (mock)", () => {
  it("needs at least 3 letters and ignores accents", async () => {
    const d = new MockDirectory();
    expect(await d.searchPeople(student(), "ra")).toMatchObject({
      error: "invalid",
      detail: "Escribe al menos 3 letras",
    });
    expect(value(await d.searchPeople(student(), "ramirez")).map((p) => p.nombre)).toEqual([
      "Sofía Ramírez",
    ]);
  });

  it("lists staff but only students who opted in, never the searcher by default", async () => {
    const d = new MockDirectory();
    expect(value(await d.searchPeople(student(), "lopez"))).toEqual([]);
    expect(value(await d.searchPeople(student(), "camila")).map((p) => p.rol)).toEqual([
      "Estudiante",
    ]);
    expect(value(await d.searchPeople(student(), "andrea batz"))).toEqual([]);
    expect(value(await d.listOffices())).toHaveLength(4);
    expect(await createRealDirectory().listEvents()).toMatchObject({ error: "unavailable" });
  });
});
