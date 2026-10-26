import { describe, expect, it } from "vitest";

import { student, value } from "@/test/actors";

import { MockSupport } from "./adapters/mock/mock-support";
import { createRealSupport } from "./adapters/real/real-support";

describe("SupportChatPort (mock)", () => {
  it("opens with identity and the screen of origin, and replies", async () => {
    const port = new MockSupport();
    const ana = student();
    const s = value(
      await port.openSession(ana, {
        departamento: "finanzas",
        pantalla: "/pagos/pagar/cuota-noviembre",
      }),
    );
    expect(s.contexto).toEqual({
      nombre: "Ana López",
      carne: "2024-0187",
      rol: "estudiante",
      pantalla: "/pagos/pagar/cuota-noviembre",
    });
    expect(s.mensajes[0]!.texto).toContain("/pagos/pagar/cuota-noviembre");
    const after = value(await port.send(ana, s.id, "No me deja pagar con ACH"));
    expect(after.mensajes.map((m) => m.de)).toEqual(["soporte", "yo", "soporte"]);
    expect(await port.send(student(), s.id, "hola")).toMatchObject({ error: "not_found" });
    expect(await port.openSession(ana, { departamento: "x" as never, pantalla: "" })).toMatchObject(
      { error: "invalid" },
    );
    expect(await createRealSupport().listFaq()).toMatchObject({ error: "unavailable" });
  });
});
