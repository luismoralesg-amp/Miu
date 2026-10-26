import { describe, expect, it } from "vitest";

import { auxiliar, student, value } from "@/test/actors";

import { MockMessaging } from "./adapters/mock/mock-messaging";
import { createRealMessaging } from "./adapters/real/real-messaging";

describe("MessagingPort (mock)", () => {
  it("threads with the people of your courses; sending appends and marks read", async () => {
    const port = new MockMessaging();
    const ana = student();
    const threads = value(await port.listThreads(ana));
    expect(threads.map((t) => t.nombre)).toEqual(["Carlos Méndez", "Jorge Castillo"]);
    expect(threads[0]!.noLeidos).toBe(1);
    const t = value(await port.send(ana, "p-lucia", "¿La lectura es del capítulo 3 o 4?"));
    expect(t.mensajes.at(-1)).toMatchObject({
      de: "yo",
      texto: "¿La lectura es del capítulo 3 o 4?",
    });
    expect(value(await port.listThreads(ana))[0]!.nombre).toBe("Lucía Herrera");
    expect(await port.send(ana, "p-lucia", "   ")).toMatchObject({ error: "invalid" });
    expect(await port.getThread(ana, "p-s010")).toMatchObject({ error: "forbidden" });
  });

  it("an Auxiliar writes to students of assigned sections only", async () => {
    const port = new MockMessaging();
    expect(value(await port.getThread(auxiliar(), "p-ana")).persona.nombre).toBe("Ana López");
    expect(await port.getThread(auxiliar("p-sofia"), "p-s110")).toMatchObject({
      error: "forbidden",
    });
    expect(await createRealMessaging().listThreads(student())).toMatchObject({
      error: "unavailable",
    });
  });
});
