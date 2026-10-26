import { test, type Page } from "@playwright/test";

import { DEMO, waitForAnimations } from "./helpers";

/**
 * Report screenshots per stage: `CAPTURE=E4 npm run e2e -- capture-screens --workers=1`.
 * Each screen is taken in the three projects (light, dark, mobile) as `<name>-<project>.png`.
 */
type Shot = {
  name: string;
  path: string;
  as: keyof typeof DEMO;
  prepare?: (page: Page) => Promise<void>;
};

const STAGES: Record<string, Shot[]> = {
  E4: [
    { name: "hoy", path: "/", as: "estudiante" },
    { name: "hoy-auxiliar", path: "/", as: "auxiliar" },
    { name: "hoy-maestro", path: "/", as: "maestro" },
    { name: "hoy-administrativo", path: "/", as: "administrativo" },
  ],
};

const stage = process.env.CAPTURE ?? "";
const shots = STAGES[stage] ?? [];

async function signInAs(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Correo de la UFM").fill(email);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.waitForURL(/\/login\/codigo$/);
  const code = (await page.getByTestId("codigo-prueba").textContent())?.trim() ?? "";
  await page.getByLabel("Código de 6 dígitos").fill(code);
  await page.waitForURL((url) => url.pathname === "/");
}

test.describe(`${stage || "no"} screenshots`, () => {
  test.skip(shots.length === 0, "Set CAPTURE=<stage> to take report screenshots");
  for (const shot of shots) {
    test(shot.name, async ({ page }, info) => {
      await signInAs(page, DEMO[shot.as]);
      await page.goto(shot.path);
      await page.waitForLoadState("networkidle");
      await shot.prepare?.(page);
      await waitForAnimations(page);
      await page.waitForTimeout(250);
      await page.screenshot({
        path: `docs/etapas/${stage}/${shot.name}-${info.project.name}.png`,
        fullPage: true,
      });
    });
  }
});
