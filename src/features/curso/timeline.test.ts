import { describe, expect, it } from "vitest";

import { at } from "@/mock/seed";
import { MockAcademic } from "@/modules/academic/adapters/mock/mock-academic";
import { MockAssessment } from "@/modules/assessment/adapters/mock/mock-assessment";
import { student, value } from "@/test/actors";

import { courseHighlights, courseTimeline, filterTimeline } from "./timeline";

async function md() {
  const now = new Date(at(0, "07:42"));
  const ana = student();
  const acad = new MockAcademic();
  const id = "matematica-discreta";
  return {
    now,
    course: value(await acad.getCourse(ana, id)),
    acts: value(
      await new MockAssessment(undefined, () => now).listActivities(ana, { courseId: id }),
    ),
    anns: value(await acad.listAnnouncements(ana, id)),
    docs: value(await acad.listDocuments(ana, id)),
  };
}

describe("course timeline", () => {
  it("orders grades, documents, today's class and what comes next", async () => {
    const { course, acts, anns, docs, now } = await md();
    const t = courseTimeline(course, acts, anns, docs, now);
    expect(t.every((e, i) => i === 0 || t[i - 1]!.fecha <= e.fecha)).toBe(true);
    const today = t.findIndex((e) => e.tipo === "clase");
    expect(t[today]).toMatchObject({ detalle: "07:00 a 08:20 · D-307 · en curso", hoy: true });
    expect(t[today + 1]).toMatchObject({ tipo: "examen", titulo: "Parcial 2" });
    expect(t.find((e) => e.titulo === "Quiz 3: lógica")).toMatchObject({
      tipo: "nota",
      detalle: "Nota publicada: 90 · Sofía Ramírez",
      nueva: true,
      pasado: false,
    });
    expect(t.find((e) => e.titulo === "Parcial 1")!.pasado).toBe(true);
    expect(t.find((e) => e.titulo === "Entregaste Tarea 4: recurrencias")).toBeDefined();
  });

  it("filters by kind", async () => {
    const { course, acts, anns, docs, now } = await md();
    const t = courseTimeline(course, acts, anns, docs, now);
    expect(filterTimeline(t, "notas").every((e) => e.tipo === "nota")).toBe(true);
    expect(filterTimeline(t, "actividades").map((e) => e.titulo)).toEqual([
      "Entregaste Tarea 4: recurrencias",
      "Parcial 2",
      "Quiz 4: grafos",
      "Proyecto final",
    ]);
    expect(filterTimeline(t, "todo")).toHaveLength(t.length);
  });

  it("highlights the next activity and the latest announcement", async () => {
    const { acts, anns, now } = await md();
    const h = courseHighlights(acts, anns, now);
    expect(h.proxima?.titulo).toBe("Parcial 2");
    expect(h.ultimoAnuncio?.titulo).toBe("El Parcial 2 cubre grafos, árboles y recurrencias");
  });
});
