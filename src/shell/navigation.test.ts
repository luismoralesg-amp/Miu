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
    const { sectionKeyByPath, BUILT } = await import("./navigation");
    // Whatever is still unbuilt answers its deep links with its own section; once all are built there is none.
    for (const [key, s] of Object.entries(SECTIONS))
      if (!s.externo && s.path !== "/" && !BUILT.has(key as SectionKey))
        expect(sectionKeyByPath(`${s.path}/x`), key).toBe(key);
    // Built sections answer their own deep links; an unknown one is a real 404.
    expect(sectionKeyByPath("/catedra/no-existe")).toBeUndefined();
    expect(sectionKeyByPath("/catedra/publicar/md-a")).toBeUndefined();
    expect(sectionKeyByPath("/admin/pagos")).toBe("conciliacion");
    expect(sectionKeyByPath("/no-existe")).toBeUndefined();
    expect(sectionKeyByPath("/pagos/no-existe")).toBeUndefined();
  });
});
