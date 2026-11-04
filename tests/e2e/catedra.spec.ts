import { expect, test } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, switchRole, testEmail } from "./helpers";

test("a Maestro goes from their sections to one section and its gradebook", async ({
  page,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  await switchRole(page, "maestro");

  await page.goto("/catedra");
  await expect(page.getByRole("heading", { level: 1, name: "Mis secciones" })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: /Matemática Discreta · [AB]/ }),
  ).toHaveCount(2);
  await expect(page.getByRole("link", { name: /Calificar Tarea 4/ }).first()).toBeVisible();
  await expectAccessible(page);

  await page.getByRole("link", { name: "Matemática Discreta · A" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Matemática Discreta" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "1 actividad espera" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Estudiantes" }).getByRole("listitem")).toHaveCount(
    28,
  );
  // Carnés stay masked for the teaching team.
  await expect(page.getByRole("list", { name: "Estudiantes" })).not.toContainText(/\d{4}-\d{4}/);
  await expectAccessible(page);

  await page.getByRole("link", { name: "Libro de notas" }).first().click();
  await expect(page).toHaveURL(/\/catedra\/libro\/md-a$/);
  await expect(page.getByRole("heading", { level: 1, name: "Libro de notas" })).toBeVisible();
  const ana = page.getByRole("row", { name: /Ana López/ });
  await expect(ana.getByRole("cell").last()).toHaveText("77.7");
  // The table scrolls inside its region; the page itself never scrolls sideways.
  const width = page.viewportSize()!.width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    width,
  );
  await expectAccessible(page);

  await page.getByRole("link", { name: "Solo bajo 61" }).click();
  await expect(page).toHaveURL(/bajo=1/);
  await expect(page.getByRole("row", { name: /Ana López/ })).toHaveCount(0);
  await page.getByRole("link", { name: "Ver toda la sección" }).click();
  await expect(page.getByRole("row", { name: /Ana López/ })).toBeVisible();

  await page
    .getByRole("navigation", { name: "Secciones" })
    .getByRole("link", { name: "Discreta B" })
    .click();
  await expect(page).toHaveURL(/\/catedra\/libro\/md-b$/);
  await expect(page.getByRole("link", { name: "Discreta B" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("the gradebook index opens the first section, and other sections are a 404", async ({
  page,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  await switchRole(page, "maestro");
  await page.goto("/catedra/libro");
  await expect(page).toHaveURL(/\/catedra\/libro\/md-a$/);
  // Jorge doesn't teach Paradigmas: same answer as a section that doesn't exist.
  expect((await page.goto("/catedra/secciones/pp-a"))?.status()).toBe(404);
  expect((await page.goto("/catedra/libro/pp-a"))?.status()).toBe(404);
  await page.goto("/");
  await switchRole(page, "estudiante");
  expect((await page.goto("/catedra"))?.status()).toBe(404);
});
