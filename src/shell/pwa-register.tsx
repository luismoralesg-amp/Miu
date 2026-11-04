"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (public/sw.js) in production only: in development a worker would
 * serve stale files and hide edits. It needs a secure context, which localhost also counts as.
 */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Without a worker MiU still works; there is just no offline page.
    });
  }, []);
  return null;
}
