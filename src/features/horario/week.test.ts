import { describe, expect, it } from "vitest";

import { at } from "@/mock/seed";
import { MockAcademic } from "@/modules/academic/adapters/mock/mock-academic";
import { MockAssessment } from "@/modules/assessment/adapters/mock/mock-assessment";
import { student, value } from "@/test/actors";

import { gridBlocks, loadLevel, scheduleIcs, weekDays, weekItems } from "./week";

async function data() {
  const now = new Date(at(0, "07:42"));
  const ana = student();
  const acad = new MockAcademic();
  return {
    now,
    term: value(await acad.getTerm()),
    schedule: value(await acad.getSchedule(ana)),
    acts: value(await new MockAssessment(undefined, () => now).listActivities(ana)),
  };
}

describe("Semana y Horario", () => {
  it("the week of Thursday 22 runs Monday 19 to Sunday 25", async () => {
    const days = weekDays((await data()).now);
    expect(days.map((d) => d.numero)).toEqual([19, 20, 21, 22, 23, 24, 25]);
    expect(days.find((d) => d.hoy)?.nombre).toBe("jueves");
    expect(days.filter((d) => d.pasado)).toHaveLength(3);
  });

  it("each day lists classes, exams and deliveries by time, with its load", async () => {
    const { now, schedule, acts } = await data();
    const week = weekItems(weekDays(now), schedule, acts);
    const fri = week[4]!;
    expect(fri.items.map((i) => [i.hora, i.tipo, i.titulo])).toEqual([
      ["07:00", "examen", "Parcial 2 de Discreta"],
      ["10:30", "clase", "Bases de Datos"],
      ["23:59", "entrega", "Ejercicio de llaves"],
    ]);
    expect(fri.carga).toBe(3);
    expect(week[5]!.carga).toBe(0);
    expect(week[6]!.items.map((i) => i.titulo)).toEqual(["Quiz 4: grafos"]);
  });

  it("load levels: free, light, medium, heavy", () => {
    expect(loadLevel([])).toBe(0);
    expect(loadLevel([{ tipo: "clase" }, { tipo: "clase" }])).toBe(1);
    expect(loadLevel([{ tipo: "clase" }, { tipo: "entrega" }, { tipo: "clase" }])).toBe(2);
    expect(loadLevel([{ tipo: "examen" }, { tipo: "clase" }, { tipo: "entrega" }])).toBe(3);
  });

  it("grid blocks sit on the real time axis and mark the class in progress", async () => {
    const { now, schedule } = await data();
    const blocks = gridBlocks(schedule, now);
    const md = blocks.find((b) => b.corto === "Discreta" && b.dia === 4)!;
    expect(md).toMatchObject({ top: 0, ahora: true });
    expect(md.height).toBeCloseTo((80 / 660) * 100, 5);
    expect(blocks.filter((b) => b.ahora)).toHaveLength(1);
  });

  it("ICS: one weekly event per section until the end of term, plus upcoming exams", async () => {
    const { now, schedule, term, acts } = await data();
    const ics = scheduleIcs(schedule, term, acts, now);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(4 + 4);
    expect(ics).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO,WE,TH;UNTIL=");
    expect(ics).toContain("SUMMARY:Matemática Discreta · sección A");
    expect(ics).toContain("UID:examen-md-parcial-2@miu.ufm.edu");
    expect(ics).toContain("DTSTART:20261019T130000Z");
  });
});
