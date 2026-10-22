import { describe, expect, it } from "vitest";

import { projectMomentum, rubberband, spring } from "./presets";

describe("projectMomentum", () => {
  it("throws a flick forward in its direction", () => {
    expect(projectMomentum(1000)).toBeCloseTo(499, 0);
    expect(projectMomentum(-1000)).toBeCloseTo(-499, 0);
    expect(projectMomentum(0)).toBe(0);
  });

  it("travels less with a snappier deceleration", () => {
    expect(Math.abs(projectMomentum(1000, 0.99))).toBeLessThan(Math.abs(projectMomentum(1000)));
  });
});

describe("rubberband", () => {
  it("resists more the further past the edge", () => {
    const small = rubberband(20, 400) / 20;
    const large = rubberband(200, 400) / 200;
    expect(large).toBeLessThan(small);
    expect(rubberband(-50, 400)).toBeCloseTo(-rubberband(50, 400));
  });
});

it("keeps the default spring critically damped", () => {
  expect(spring.settle.bounce).toBe(0);
});
