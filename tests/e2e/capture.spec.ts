import { test } from "@playwright/test";

import { waitForAnimations } from "./helpers";

/**
 * Stage report screenshots. Skipped unless CAPTURE is set to the stage name, e.g.
 * CAPTURE=E1 npm run e2e -- capture
 */
const stage = process.env.CAPTURE;
const pages = [
  ["fundamentos", "/dev/sistema"],
  ["componentes", "/dev/sistema/componentes"],
  ["estados", "/dev/sistema/estados"],
  ["hoy", "/dev/sistema/hoy"],
] as const;

test.describe("stage screenshots", () => {
  test.skip(!stage, "Set CAPTURE=<stage> to take report screenshots");

  for (const [name, path] of pages) {
    test(name, async ({ page }, testInfo) => {
      await page.goto(path);
      await waitForAnimations(page);
      await page.screenshot({
        path: `docs/etapas/${stage}/${name}-${testInfo.project.name}.png`,
        fullPage: true,
      });
    });
  }
});
