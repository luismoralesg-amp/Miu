import { expect, test } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, switchRole, testEmail } from "./helpers";

test("the Administrativo changes the threshold and the card fee, and the teaching screens follow", async ({
  page,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  await switchRole(page, "administrativo");
  await page.goto("/admin/politicas");
  await expect(page.getByRole("heading", { level: 1, name: "Políticas" })).toBeVisible();
  await expect(page.getByLabel("Umbral")).toHaveValue("61");
  await expect(page.getByText(/cuesta\s+Q334\.45/)).toBeVisible();
  await expectAccessible(page);

  // The fee preview follows what is typed.
  await page.getByLabel("Porcentaje").fill("5");
  await expect(page.getByText(/cuesta\s+Q371\.39/)).toBeVisible();

  // Goals out of order are refused with a reason.
  await page.getByLabel("Umbral").fill("65");
  await page.getByLabel("Meta 1").fill("90");
  await page.getByRole("button", { name: "Guardar políticas" }).click();
  await expect(page.getByText("Las metas van de menor a mayor")).toBeVisible();
  // A refused save keeps what was typed.
  await expect(page.getByLabel("Umbral")).toHaveValue("65");

  await page.getByLabel("Meta 1").fill("75");
  await page.getByLabel("Meta 2").fill("82");
  await page.getByLabel("Meta 3").fill("92");
  await page.getByRole("button", { name: "Guardar políticas" }).click();
  await expect(page.getByRole("status")).toContainText("Guardado");
  await page.reload();
  await expect(page.getByLabel("Umbral")).toHaveValue("65");
  await expect(page.getByLabel("Porcentaje")).toHaveValue("5");

  // The new threshold reaches the teaching screens.
  await switchRole(page, "maestro");
  await page.goto("/catedra/estadisticas");
  await expect(page.getByText("Bajo 65").first()).toBeVisible();
  await expect(page.getByText(/Umbral 65 y metas 75\/82\/92/).first()).toBeVisible();
});

test("the Administrativo lets an Auxiliar close one section, and takes it back", async ({
  page,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  await switchRole(page, "administrativo");
  await page.goto("/admin/roles");
  await expect(page.getByRole("heading", { level: 1, name: "Roles" })).toBeVisible();
  // The matrix is read-only and scrolls inside its own region.
  await expect(page.getByRole("columnheader", { name: "Administrativo" })).toBeVisible();
  await expect(page.getByRole("rowheader", { name: "Cerrar la nota final" })).toBeVisible();
  const width = page.viewportSize()!.width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    width,
  );
  await expectAccessible(page);

  const row = page.getByRole("listitem", { name: /Carlos Méndez, .*Discreta B/ });
  await expect(row.getByText("Sin permiso")).toBeVisible();
  await row.getByRole("button", { name: /^Otorgar a Carlos Méndez/ }).click();
  await expect(row.getByText("Puede cerrar")).toBeVisible();

  await switchRole(page, "auxiliar");
  await page.goto("/catedra");
  await expect(page.getByRole("link", { name: /Cerrar la nota final de .* B/ })).toBeVisible();
  await page.goto("/catedra/cierre");
  await expect(page.getByRole("heading", { level: 1, name: "Cerrar nota final" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /Discreta · B/ })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /Discreta · A/ })).toHaveCount(0);
  await expectAccessible(page);

  await page.goto("/");
  await switchRole(page, "administrativo");
  await page.goto("/admin/roles");
  await row.getByRole("button", { name: /^Quitar a Carlos Méndez/ }).click();
  await expect(row.getByText("Sin permiso")).toBeVisible();
  await page.goto("/");
  await switchRole(page, "auxiliar");
  expect((await page.goto("/catedra/cierre"))?.status()).toBe(404);
});

test("policies and roles are the Administrativo's alone", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  for (const role of ["estudiante", "maestro", "auxiliar"] as const) {
    await page.goto("/");
    await switchRole(page, role);
    for (const path of ["politicas", "roles"])
      expect((await page.goto(`/admin/${path}`))?.status(), `${role} ${path}`).toBe(404);
  }
});
