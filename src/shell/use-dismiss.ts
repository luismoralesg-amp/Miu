"use client";

import { useEffect, type RefObject } from "react";

/** Closes a popover on Escape or on a pointer-down outside it (and outside its trigger). */
export function useDismiss(
  open: boolean,
  close: () => void,
  refs: Array<RefObject<HTMLElement | null>>,
) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!refs.some((r) => r.current?.contains(target))) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
    // RefObjects are stable; re-subscribing only when open/close change is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, close]);
}

/**
 * Popover motion (emil-design-eng): scale from the trigger's corner, 180 ms in, 120 ms out, ease-out.
 * CSS transitions, so a reopen mid-close retargets instead of restarting. Reduced motion keeps the fade.
 */
export const popoverMotion =
  "transition-[opacity,scale,visibility] duration-180 ease-(--ease-out) data-[open=false]:invisible data-[open=false]:scale-[0.97] data-[open=false]:opacity-0 data-[open=false]:duration-120 motion-reduce:data-[open=false]:scale-100";
