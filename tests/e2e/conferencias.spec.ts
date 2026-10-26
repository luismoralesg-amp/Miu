import { expect, test } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, testEmail } from "./helpers";

test("reserve, join a waiting list and evaluate a talk", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/conferencias");
  await expectAccessible(page);
  const mercados = page.getByRole("listitem", { name: "Mercados y conocimiento disperso" });
  await mercados.getByRole("button", { name: "Reservar" }).click();
  await expect(mercados).toContainText("Reservada");
  const etica = page.getByRole("listitem", { name: "Ética en la inteligencia artificial" });
  await etica.getByRole("button", { name: "Unirme a la lista de espera" }).click();
  await expect(etica).toContainText("En espera · puesto 4");

  await page.getByRole("link", { name: "Mis reservas" }).click();
  await expect(page.getByRole("heading", { name: /^Por evaluar/ })).toBeVisible();
  await expect(page.getByRole("listitem", { name: "Derecho y libertad" })).toContainText(
    "Expirada",
  );
  await page
    .getByRole("listitem", { name: "Historia de la moneda" })
    .getByRole("link", { name: "Evaluar" })
    .click();
  await expect(page).toHaveURL(/\/conferencias\/historia-moneda\/evaluacion$/);
  await expectAccessible(page);
  await page.getByRole("button", { name: "Enviar evaluación" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Elige una calificación" })).toBeVisible();
  await page.getByText("Buena").click();
  await page.getByLabel(/Comentario/).fill("Muy clara.");
  await page.getByRole("button", { name: "Enviar evaluación" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Tu evaluación quedó registrada" }),
  ).toBeVisible();
  await expect(page.getByRole("listitem", { name: "Historia de la moneda" })).toContainText(
    "Evaluada",
  );
});
