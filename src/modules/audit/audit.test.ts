import { describe, expect, it } from "vitest";

import { admin, auxiliar, maestro, value } from "@/test/actors";

import { MockAudit } from "./adapters/mock/mock-audit";
import { createRealAudit } from "./adapters/real/real-audit";

describe("AuditPort (mock)", () => {
  it("appends frozen entries and each role sees its slice", async () => {
    const port = new MockAudit();
    const carlos = auxiliar();
    const e = value(
      await port.record(carlos, {
        accion: "calificar",
        recurso: "pp-actividad-6/p-s003",
        sectionId: "pp-a",
        detalle: "Nota 55",
        despues: "55",
        motivo: "Sin pruebas y dos funciones no compilan.",
      }),
    );
    expect(e).toMatchObject({ actorId: "p-carlos", rol: "auxiliar", accion: "calificar" });
    expect(value(await port.query(carlos, {}))).toHaveLength(1);
    expect(value(await port.query(auxiliar("p-sofia"), {}))).toHaveLength(0);
    expect(value(await port.query(admin(), {}))).toHaveLength(1);
    expect(value(await port.query(maestro(), { sectionIds: ["md-a", "md-b"] }))).toHaveLength(0);
    expect(value(await port.query(maestro(), { sectionIds: ["pp-a"] }))).toHaveLength(1);
  });

  it("rejects an entry without what changed", async () => {
    expect(
      await new MockAudit().record(auxiliar(), { accion: "calificar", recurso: "", detalle: "x" }),
    ).toMatchObject({
      error: "invalid",
    });
    expect(await createRealAudit().query(admin(), {})).toMatchObject({ error: "unavailable" });
  });
});
