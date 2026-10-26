"use client";

import { cx } from "@/lib/cx";

import { useDemoClock } from "../shared/demo-clock";

/**
 * Hours and minutes left. The minute changes without animation (it is read, not watched); screen
 * readers get one sentence instead of separate numbers.
 */
export function Countdown({
  target,
  now,
  className,
}: {
  target: string;
  now: string;
  className?: string;
}) {
  const clock = useDemoClock(now);
  const total = Math.max(0, Math.round((Date.parse(target) - clock.getTime()) / 6e4));
  const h = Math.floor(total / 60);
  const min = total % 60;
  const label =
    h >= 48
      ? `Faltan ${Math.round(h / 24)} días`
      : `Faltan ${h} ${h === 1 ? "hora" : "horas"} y ${min} ${min === 1 ? "minuto" : "minutos"}`;
  return (
    <p className={cx("flex items-baseline gap-1 display leading-none", className)}>
      <span className="sr-only">{label}</span>
      {h >= 48 ? (
        <span aria-hidden="true" className="flex items-baseline gap-1">
          <span className="text-[52px] md:text-[64px]">{Math.round(h / 24)}</span>
          <span className="text-lg">días</span>
        </span>
      ) : (
        <span aria-hidden="true" className="flex items-baseline gap-1">
          <span className="text-[52px] md:text-[64px]">{h}</span>
          <span className="text-lg">h</span>
          <span className="ml-2 text-[52px] md:text-[64px]">{String(min).padStart(2, "0")}</span>
          <span className="text-lg">min</span>
        </span>
      )}
    </p>
  );
}
