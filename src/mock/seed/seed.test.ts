import { describe, expect, it } from "vitest";

import { HOY, weekdayName } from "@/lib/clock";

import { ACTIVITIES, BATCH_PP_A6, COURSES, PEOPLE, SECTIONS, STUDENT_GRADES, buildSeed } from ".";
import { at, day } from "./time";

describe("seed", () => {
  it("is the same on every build", () => {
    expect(buildSeed()).toEqual(buildSeed());
    expect(buildSeed()).toMatchSnapshot();
  });

  it("lives on Thursday 22 October 2026", () => {
    expect(weekdayName(HOY)).toBe("jueves");
    expect(day(0)).toBe("2026-10-22");
    expect(at(1, "07:00")).toBe("2026-10-23T07:00:00-06:00");
    expect(weekdayName(new Date(at(3)))).toBe("domingo");
    expect(day(6)).toBe("2026-10-28");
    expect(weekdayName(new Date(at(6, "12:00")))).toBe("miércoles");
  });

  it("has the people of PLAN §7 and nobody else with a login", () => {
    const logins = PEOPLE.filter((p) => p.userId);
    expect(logins.map((p) => p.tipo).sort()).toEqual([
      "administrativo",
      "auxiliar",
      "auxiliar",
      "catedratico",
      "estudiante",
    ]);
    expect(new Set(PEOPLE.map((p) => p.id)).size).toBe(PEOPLE.length);
    for (const p of PEOPLE) expect(p.correo).toMatch(/\.demo@ufm\.edu$/);
  });

  it("weights of every course add up to 100", () => {
    for (const course of COURSES) {
      const total = ACTIVITIES.filter((a) => a.courseId === course.id).reduce(
        (s, a) => s + a.peso,
        0,
      );
      expect(total, course.id).toBe(100);
    }
  });

  it("every rubric adds up to 100 and every grade points at a real activity", () => {
    for (const a of ACTIVITIES) {
      expect(
        a.rubrica.reduce((s, [, w]) => s + w, 0),
        a.id,
      ).toBe(100);
    }
    const ids = new Set(ACTIVITIES.map((a) => a.id));
    for (const g of STUDENT_GRADES) expect(ids.has(g.activityId), g.activityId).toBe(true);
  });

  it("matches the ronda 3 course averages", () => {
    const avg = (courseId: string) => {
      const graded = STUDENT_GRADES.map((g) => ({
        g,
        a: ACTIVITIES.find((a) => a.id === g.activityId)!,
      })).filter(({ a }) => a.courseId === courseId);
      const peso = graded.reduce((s, { a }) => s + a.peso, 0);
      const puntos = graded.reduce((s, { a, g }) => s + (a.peso * g.nota) / 100, 0);
      return Math.round((puntos / peso) * 1000) / 10;
    };
    expect(avg("matematica-discreta")).toBe(77.7);
    expect(avg("paradigmas-de-programacion")).toBe(91);
    expect(avg("etica-de-la-libertad")).toBe(87);
    expect(avg("bases-de-datos-1")).toBe(84);
  });

  it("the batch of Actividad 6 covers the whole section A of Paradigmas", () => {
    const section = SECTIONS.find((s) => s.id === "pp-a")!;
    expect(BATCH_PP_A6).toHaveLength(24);
    expect(new Set(BATCH_PP_A6.map((e) => e.studentId))).toEqual(new Set(section.estudianteIds));
    expect(BATCH_PP_A6.filter((e) => e.nota !== null)).toHaveLength(4);
  });
});
