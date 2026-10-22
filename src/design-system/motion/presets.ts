/**
 * Motion presets for interactive, interruptible animation with `motion`.
 *
 * Springs use Apple's two-parameter model (apple-design §4): `bounce: 0` is critically damped and is
 * the default; bounce only appears when a gesture carried momentum (a flick or a drag release).
 * Non-gesture UI stays on CSS transitions with the tokens in globals.css (emil-design-eng).
 */
export const spring = {
  /** Default: repositioning, expanding, content settling. No overshoot. */
  settle: { type: "spring", bounce: 0, duration: 0.35 },
  /** Sheets and drawers released with velocity. */
  sheet: { type: "spring", bounce: 0.15, duration: 0.3 },
  /** Cards flicked or thrown. */
  momentum: { type: "spring", bounce: 0.2, duration: 0.4 },
} as const;

/** Matches the CSS duration tokens, for the rare case JS needs a timer aligned with CSS. */
export const durationMs = {
  press: 140,
  fast: 180,
  base: 240,
  reveal: 360,
} as const;

/**
 * Apple's momentum projection: where a flick would come to rest (apple-design §6).
 * @param velocity release velocity in px/s
 * @param decelerationRate 0.998 for normal scroll feel, 0.99 for snappier
 */
export function projectMomentum(velocity: number, decelerationRate = 0.998): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** Progressive resistance past a boundary instead of a hard stop (apple-design §9). */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
