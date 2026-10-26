import { describe, expect, it } from "vitest";

import { at } from "@/mock/seed";
import { MockAcademic } from "@/modules/academic/adapters/mock/mock-academic";
import { MockAssessment } from "@/modules/assessment/adapters/mock/mock-assessment";
import { auxiliar, student, value } from "@/test/actors";

import { MockInbox } from "./adapters/mock/mock-inbox";
import { createRealInbox } from "./adapters/real/real-inbox";

const now = () => new Date(at(0, "07:42"));
function setup() {
  const acad = new MockAcademic();
  const assess = new MockAssessment(undefined, now);
  const inbox = new MockInbox({ academic: () => acad, assessment: () => assess }, now);
  return { inbox, assess };
}

describe("InboxPort (mock)", () => {
  it("listItems and count come from the same query", async () => {
    const { inbox } = setup();
    const ana = student();
    const list = value(await inbox.listItems(ana));
    expect(list.total).toBe(list.items.length);
    expect(value(await inbox.count(ana))).toBe(list.items.length);
    expect(list.porTipo.pendiente + list.porTipo.aviso + list.porTipo.pago).toBe(list.total);
  });

  it("urgent first: tomorrow's exam (in 23 h) leads, then work by due date", async () => {
    const { inbox } = setup();
    const items = value(await inbox.listItems(student())).items;
    expect(items.slice(0, 2).map((i) => i.titulo)).toEqual([
      "Parcial 2 de Discreta",
      "Ejercicio de llaves",
    ]);
    expect(items.map((i) => i.urgente).slice(0, 2)).toEqual([true, false]);
  });

  it("reading a notice and submitting work both shrink list and badge together", async () => {
    const { inbox, assess } = setup();
    const ana = student();
    const before = value(await inbox.listItems(ana));
    const aviso = before.items.find((i) => i.tipo === "aviso")!;
    expect(value(await inbox.markRead(ana, aviso.id)).total).toBe(before.total - 1);
    await assess.submit(ana, "pp-ejercicio-llaves", {
      archivo: "llaves.zip",
      tamanoBytes: 100,
      hash: "b".repeat(64),
    });
    const after = value(await inbox.listItems(ana));
    expect(after.total).toBe(before.total - 2);
    expect(value(await inbox.count(ana))).toBe(after.items.length);
    expect(value(await inbox.markAllRead(ana)).total).toBe(
      after.porTipo.pendiente + after.porTipo.pago,
    );
  });

  it("teaching roles get their grading queue and new appeals", async () => {
    const { inbox } = setup();
    const items = value(await inbox.listItems(auxiliar())).items;
    expect(items.map((i) => i.titulo)).toEqual(
      expect.arrayContaining(["20 entregas por calificar", "22 entregas por calificar"]),
    );
  });

  it("the real adapter answers unavailable", async () => {
    expect(await createRealInbox().count(student())).toMatchObject({ error: "unavailable" });
  });
});
