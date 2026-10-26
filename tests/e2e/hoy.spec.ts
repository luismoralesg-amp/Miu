import { expect, test } from "@playwright/test";

import { expectAccessible, watchCsp } from "./a11y";
import { clearFault, injectFault, signIn, switchRole, testEmail } from "./helpers";

test("Hoy puts the next exam first, then the day, work and news", async ({ page }, info) => {
  const csp = watchCsp(page);
  await signIn(page, testEmail(info.project.name));
  const hero = page.getByRole("article", { name: "Parcial 2 de Matemática Discreta" });
  await expect(hero).toBeVisible();
  await expect(hero.getByText("Faltan 23 horas y 18 minutos")).toBeAttached();
  await expect(hero.getByRole("link", { name: "Repasar" })).toHaveAttribute(
    "href",
    "/cursos/matematica-discreta/documentos",
  );
  await expect(page.getByText("3 clases · 4 h 20 min libres entre clases")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Matemática Discreta, 07:00 a 08:20, D-307, en curso/ }),
  ).toBeVisible();
  const pending = page.getByRole("region", { name: "Por entregar" }).getByRole("listitem");
  await expect(pending.first()).toContainText("Ejercicio de llaves");
  await expect(page.getByRole("link", { name: /Q7,387.80/ })).toHaveAttribute(
    "href",
    "/pagos/pagar/cuota-noviembre",
  );
  await expectAccessible(page);
  expect(csp).toEqual([]);
});

test("a port that times out shows the timeout state, and retry recovers", async ({
  page,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  await injectFault(page, "assessment", "timeout");
  await page.reload();
  const timeout = page
    .getByRole("alert")
    .filter({ hasText: "Esto está tardando más de lo normal" });
  await expect(timeout.first()).toBeVisible();
  await expect(page.getByText("3 clases · 4 h 20 min libres entre clases")).toBeVisible();
  await expectAccessible(page);
  await clearFault(page);
  await timeout.first().getByRole("button", { name: "Reintentar" }).click();
  await expect(
    page.getByRole("article", { name: "Parcial 2 de Matemática Discreta" }),
  ).toBeVisible();
});

test("an unavailable port shows an error only in its own section", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  await injectFault(page, "inbox", "unavailable");
  await page.reload();
  await expect(page.getByText("No pudimos cargar tus novedades")).toBeVisible();
  await expect(
    page.getByRole("article", { name: "Parcial 2 de Matemática Discreta" }),
  ).toBeVisible();
  await clearFault(page);
});

test("teaching roles see what is waiting to be graded first", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  await switchRole(page, "auxiliar");
  const focus = page.getByRole("article", { name: /Actividad 6: closures · Paradigmas A/ });
  await expect(focus).toBeVisible();
  await expect(focus.getByRole("link", { name: "Calificar" })).toBeVisible();
  await expectAccessible(page);
});
