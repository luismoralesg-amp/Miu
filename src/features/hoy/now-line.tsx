"use client";

import type { CSSProperties } from "react";

import { useDemoClock } from "../shared/demo-clock";

/**
 * The "now" marker on the day axis. It glides linearly between minute ticks (transform only, off
 * the main thread); with reduced motion it just jumps each minute.
 */
export function NowLine({ now, desde, hasta }: { now: string; desde: number; hasta: number }) {
  const clock = useDemoClock(now, 60_000);
  const g = new Date(clock.getTime() - 6 * 36e5);
  const min = g.getUTCHours() * 60 + g.getUTCMinutes();
  const pos = ((min - desde * 60) / ((hasta - desde) * 60)) * 100;
  if (pos < 0 || pos > 100) return null;
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 w-full transition-transform duration-[60s] ease-linear motion-reduce:transition-none"
      style={{ transform: `translateX(${pos}%)` } as CSSProperties}
    >
      <span className="absolute -top-2 -bottom-2 left-0 w-0.5 -translate-x-1/2 bg-fg">
        <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-fg" />
      </span>
    </span>
  );
}
