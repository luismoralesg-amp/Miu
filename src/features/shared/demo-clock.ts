"use client";

import { useEffect, useState } from "react";

/**
 * The mock lives at a fixed moment (HOY). On the client, time moves on from the server's "now" at the
 * real pace, so countdowns and the "now" line advance without jumping to the real date.
 */
export function useDemoClock(serverNow: string, everyMs = 30_000) {
  const [now, setNow] = useState(() => new Date(serverNow));
  useEffect(() => {
    const base = Date.parse(serverNow);
    const start = Date.now();
    const id = window.setInterval(() => setNow(new Date(base + (Date.now() - start))), everyMs);
    return () => window.clearInterval(id);
  }, [serverNow, everyMs]);
  return now;
}
