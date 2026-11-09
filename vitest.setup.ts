import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  // Server-only suites run in the node environment, where there is no document.
  if (typeof document !== "undefined") document.documentElement.removeAttribute("data-theme");
});
