import { describe, expect, it } from "vitest";

import { at } from "@/mock/seed";
import { MockAcademic } from "@/modules/academic/adapters/mock/mock-academic";
import { MockAssessment } from "@/modules/assessment/adapters/mock/mock-assessment";
import { student, value } from "@/test/actors";

import { buildToday, dayTimeline, duration, pickHero, upcoming, variantFor } from "./today";

async function load(now: Date) {
  const ana = student();
  const acad = new MockAcademic();
  const activities = value(await new MockAssessment(undefined, () => now).listActivities(ana));
  return {
    now,
    term: value(await acad.getTerm()),
    schedule: value(await acad.getSchedule(ana)),
    activities,
  };
}

describe("Hoy · urgent first", () => {
  it("upcoming: only what still needs the student, soonest first", async () => {
    const { activities, now } = await load(new Date(at(0, "07:42")));
    const list = upcoming(activities, now);
    expect(list.slice(0, 4).map((a) => a.titulo)).toEqual([
      "Parcial 2",
      "Ejercicio de llaves",
      "Quiz 4: grafos",
      "Lectura: Hayek, capítulo 3",
    ]);
    expect(list.every((a) => a.estado === "pendiente" || a.estado === "programada")).toBe(true);
  });

  it("hero: tomorrow's exam is urgent (23 h 18 min away)", async () => {
    const { activities, now } = await load(new Date(at(0, "07:42")));
    const hero = pickHero(activities, now)!;
    expect(hero.activity.id).toBe("md-parcial-2");
    expect(hero.estado).toBe("urgente");
  });

  it("hero: between 24 and 72 h it is normal; beyond 72 h there is none", async () => {
    const sat = await load(new Date(at(2, "10:00")));
    expect(pickHero(sat.activities, sat.now)).toMatchObject({
      activity: { id: "md-quiz-4" },
      estado: "normal",
    });
    const later = await load(new Date(at(19, "10:00")));
    expect(pickHero(later.activities, later.now)).toBeNull();
  });
});

describe("Hoy · the day", () => {
  it("Thursday: Discreta now, Paradigmas next, 4 h 20 min free between classes", async () => {
    const { schedule, now } = await load(new Date(at(0, "07:42")));
    const day = dayTimeline(schedule, now);
    expect(day.clases.map((c) => [c.corto, c.estado])).toEqual([
      ["Discreta", "ahora"],
      ["Paradigmas", "proxima"],
      ["Ética", "proxima"],
    ]);
    expect(day.huecos.map((h) => h.min)).toEqual([40, 220]);
    expect(duration(day.libre)).toBe("4 h 20 min");
    expect(day.ahoraPos).toBeCloseTo((42 / 660) * 100, 5);
  });

  it("variant: day, night after 18:00, exam layout during exam week", async () => {
    const { term } = await load(new Date(at(0, "07:42")));
    expect(variantFor(new Date(at(0, "07:42")), term)).toBe("dia");
    expect(variantFor(new Date(at(0, "20:15")), term)).toBe("noche");
    expect(variantFor(new Date(at(4, "08:00")), term)).toBe("examenes");
  });

  it("buildToday: week 12 of 18, hero apart from the list, payment notice six days out", async () => {
    const data = await load(new Date(at(0, "07:42")));
    const today = buildToday({
      ...data,
      avisos: [],
      balance: {
        saldo: 7387.8,
        pendientes: 1,
        solvente: true,
        proximo: {
          id: "cuota-noviembre",
          concepto: "Cuota de noviembre",
          monto: 7387.8,
          emitido: "2026-09-30",
          vence: "2026-10-28",
          referencia: "MIU-26-004127",
          desglose: [],
          estado: "pendiente",
          diasParaVencer: 6,
        },
      },
    });
    expect(today.fecha).toBe("Jueves 22 de octubre");
    expect(today.semana).toEqual({ actual: 12, total: 18 });
    expect(today.porEntregar[0]!.titulo).toBe("Ejercicio de llaves");
    expect(today.porEntregar.some((a) => a.id === today.hero?.activity.id)).toBe(false);
    expect(today.aviso).toMatchObject({ monto: 7387.8, dias: 6 });
  });

  it("night: what happened today and what comes tomorrow", async () => {
    const data = await load(new Date(at(0, "20:15")));
    const today = buildToday({ ...data, avisos: [], balance: null });
    expect(today.saludo).toBe("Buenas noches");
    expect(today.noche.clasesHoy.map((c) => c.corto)).toEqual(["Discreta", "Paradigmas", "Ética"]);
    expect(today.noche.manana.map((m) => m.titulo)).toEqual([
      "Bases de Datos I",
      "Entrega: Ejercicio de llaves",
    ]);
  });

  it("exam week: exams in the window and free hours each day", async () => {
    const data = await load(new Date(at(4, "07:30")));
    const today = buildToday({ ...data, avisos: [], balance: null });
    expect(today.variante).toBe("examenes");
    expect(today.examenes!.lista.map((x) => x.curso.corto)).toEqual([
      "Paradigmas",
      "Bases de Datos",
      "Ética",
    ]);
    expect(today.examenes!.libres).toHaveLength(4);
    expect(today.examenes!.libres[0]!.minutos).toBeGreaterThan(0);
  });
});
