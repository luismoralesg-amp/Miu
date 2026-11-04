import { expect, test } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, switchRole, testEmail } from "./helpers";

test("a Maestro grades a batch, publishes it from the review and closes the final grade", async ({
  page,
}, info) => {
  test.skip(info.project.name === "mobile", "Keyboard flow; mobile is covered by the next test");
  test.setTimeout(90_000);
  await signIn(page, testEmail(info.project.name));
  await switchRole(page, "maestro");

  // Nothing can close while Tarea 4 is still ungraded.
  await page.goto("/catedra/cierre");
  await expect(page.getByRole("heading", { level: 1, name: "Cerrar nota final" })).toBeVisible();
  const discretaB = page.getByRole("listitem", { name: /Matemática Discreta · B/ });
  await expect(discretaB.getByText("Antes de cerrar")).toBeVisible();
  await expect(discretaB.getByRole("button", { name: /Cerrar la nota final/ })).toHaveCount(0);
  await expectAccessible(page);

  // Grade the whole batch from the keyboard.
  await page.goto("/catedra/por-calificar?seccion=md-b&actividad=md-tarea-4");
  const first = page
    .getByLabel(/^Nota de /)
    .filter({ visible: true })
    .first();
  await first.focus();
  const total = await page
    .getByLabel(/^Nota de /)
    .filter({ visible: true })
    .count();
  for (let i = 1; i <= total; i++) {
    await page.keyboard.type("85");
    await page.keyboard.press("Enter");
    await expect(page.getByText(new RegExp(`^${i} de ${total}$`))).toBeVisible();
  }

  // Publish from the review, not from the batch.
  await page.goto("/catedra/publicar");
  await expect(page.getByRole("heading", { level: 1, name: "Publicar notas" })).toBeVisible();
  const row = page
    .getByRole("region", { name: /Discreta · B/ })
    .getByRole("listitem", { name: "Tarea 4: recurrencias" });
  await expect(row.getByText(`${total} guardadas sin publicar`)).toBeVisible();
  await expect(row.getByText(`ninguna bajo 61`)).toBeVisible();
  await expectAccessible(page);
  await row.getByRole("button", { name: /^Publicar/ }).click();
  await expect(row.getByRole("status")).toContainText(`Publicaste ${total} notas`);
  await expect(row.getByText("Publicada")).toBeVisible();

  // Now Discreta B can close; the upcoming activities need an explicit confirmation.
  await page.goto("/catedra/cierre");
  const card = page.getByRole("listitem", { name: /Matemática Discreta · B/ });
  const close = card.getByRole("button", { name: /Cerrar la nota final/ });
  await expect(close).toBeVisible();
  await expectAccessible(page);
  await card.getByRole("checkbox").check();
  await close.click();
  await expect(card.getByRole("status")).toContainText("Nota final cerrada");
  await page.reload();
  await expect(card.getByText("Cerrada", { exact: true })).toBeVisible();

  // The gradebook says so, and grading is over for that section.
  await page.goto("/catedra/libro/md-b");
  await expect(page.getByText("Nota final cerrada")).toBeVisible();
  await page.goto("/catedra/publicar");
  await expect(page.getByText("Nota final cerrada").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /^Publicar/ })).toHaveCount(0);
});

test("publish is for the whole teaching team; closing the final grade is the Maestro's", async ({
  page,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  expect((await page.goto("/catedra/publicar"))?.status()).toBe(404);
  expect((await page.goto("/catedra/cierre"))?.status()).toBe(404);
  await page.goto("/");
  await switchRole(page, "auxiliar");
  await page.goto("/catedra/publicar");
  await expect(page.getByRole("heading", { level: 1, name: "Publicar notas" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /Discreta · B/ })).toBeVisible();
  await expectAccessible(page);
  // The Auxiliar holds no `close_final_grade`: same 404 as a page that doesn't exist.
  expect((await page.goto("/catedra/cierre"))?.status()).toBe(404);
  await page.goto("/");
  await switchRole(page, "maestro");
  await page.goto("/catedra/publicar");
  await expect(page.getByRole("heading", { level: 2, name: /Discreta · A/ })).toBeVisible();
  await expectAccessible(page);
  await page.goto("/catedra/cierre");
  await expectAccessible(page);
});
