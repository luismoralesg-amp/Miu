import { describe, expect, it } from "vitest";

import { distribution } from "./stats";

describe("distribution", () => {
  it("puts each grade in exactly one band", () => {
    const grades = [0, 40, 60, 61, 70, 71, 79, 80, 89, 90, 100];
    const bands = distribution(grades, 61, [71, 80, 90]);
    expect(bands.map((b) => [b.label, b.count])).toEqual([
      ["Bajo 61", 3],
      ["61 a 70", 2],
      ["71 a 79", 2],
      ["80 a 89", 2],
      ["90 o más", 2],
    ]);
    expect(bands.reduce((s, b) => s + b.count, 0)).toBe(grades.length);
  });

  it("is empty without grades", () => {
    expect(distribution([], 61, [71, 80, 90]).every((b) => b.count === 0)).toBe(true);
  });
});
