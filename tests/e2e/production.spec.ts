import { expect, test } from "@playwright/test";

import { PROD_PORT } from "../../playwright.config";

/** Runs against `next start` without MIU_DEV_TOOLS: no role switcher, outbox or developer catalog. */
test.use({ baseURL: `http://localhost:${PROD_PORT}` });

test("production hides the role switcher and the developer tools", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo de la UFM").fill("ana.lopez.demo@ufm.edu");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.waitForURL(/\/login\/codigo$/);
  await expect(page.getByTestId("codigo-prueba")).toHaveCount(0);

  await page.goto("/login");
  await page.getByRole("button", { name: "Continuar con Google" }).click();
  await page.waitForURL((url) => url.pathname === "/");
  await page.getByRole("button", { name: /^Tu cuenta/ }).click();
  await expect(page.getByRole("dialog", { name: "Tu cuenta" })).toBeVisible();
  await expect(page.getByLabel("Rol (desarrollo)")).toHaveCount(0);

  const catalog = await page.goto("/dev/sistema");
  expect(catalog?.status()).toBe(404);
});
