import { describe, expect, it } from "vitest";

import { roles } from "@/modules/identity";

import { NAV, SECTIONS, sectionAllowed, type SectionKey } from "./navigation";

describe("navigation and authorization agree", () => {
  it.each([...roles])("every section shown to %s is one it may open", (role) => {
    const nav = NAV[role];
    const shown = new Set<SectionKey>([...nav.barra, ...nav.mas.flatMap(([, keys]) => keys)]);
    for (const key of shown) expect(sectionAllowed(role, key), `${role} → ${key}`).toBe(true);
  });

  it("teaching and admin sections are closed to students", () => {
    for (const key of ["catedra", "porCalificar", "politicas", "conciliacion"] as const) {
      expect(sectionAllowed("estudiante", key), SECTIONS[key].path).toBe(false);
    }
    expect(sectionAllowed("maestro", "pagos")).toBe(false);
  });
});

describe("deep links into sections still being built", () => {
  it("land on the closest section instead of a 404", async () => {
    const { sectionKeyByPath } = await import("./navigation");
    expect(sectionKeyByPath("/catedra/secciones/md-a")).toBe("catedra");
    expect(sectionKeyByPath("/catedra/libro/pp-a")).toBe("libro");
    expect(sectionKeyByPath("/admin/pagos")).toBe("conciliacion");
    expect(sectionKeyByPath("/no-existe")).toBeUndefined();
    expect(sectionKeyByPath("/pagos/no-existe")).toBeUndefined();
  });
});
