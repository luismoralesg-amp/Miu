import { expect, test } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, testEmail } from "./helpers";

test("save next term's preferences with step-up, and drop a course", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/asignacion");
  await expect(page.getByRole("heading", { level: 1, name: "Asignación 2027-1" })).toBeVisible();
  await expectAccessible(page);

  await page.getByRole("checkbox", { name: /Redes de computadoras/ }).check();
  await page.getByRole("checkbox", { name: /Inteligencia artificial/ }).check();
  const resumen = page.getByRole("complementary", { name: "Resumen de tu asignación" });
  await expect(resumen).toContainText("8 de 24 UMA");
  await expect(
    page.getByRole("alert").filter({ hasText: "Choca de horario con Redes de computadoras" }),
  ).toBeVisible();
  await expect(resumen.getByRole("button", { name: "Guardar preferencias" })).toBeDisabled();
  const ia = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("checkbox", { name: /Inteligencia artificial/ }) });
  await ia.getByLabel("1.ª opción").selectOption({ index: 1 });
  await expect(page.getByRole("alert").filter({ hasText: "Choca de horario" })).toHaveCount(0);
  await resumen.getByRole("button", { name: "Guardar preferencias" }).click();
  await page.getByRole("button", { name: "Enviarme el código" }).click();
  const code = (await page.getByTestId("codigo-step-up").textContent())?.trim() ?? "";
  await page.getByLabel("Código de 6 dígitos").fill(code === "000000" ? "111111" : "000000");
  await page.getByRole("button", { name: "Confirmar y guardar" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "El código no coincide" })).toBeVisible();
  await page.getByLabel("Código de 6 dígitos").fill(code);
  await page.getByRole("button", { name: "Confirmar y guardar" }).click();
  await expect(resumen.getByRole("status")).toContainText("Guardadas");

  const etica = page.getByRole("listitem", { name: "Ética de la Libertad" });
  await etica.getByRole("button", { name: "Botar Ética de la Libertad" }).click();
  await etica.getByRole("button", { name: "Enviarme el código" }).click();
  const code2 = (await etica.getByTestId("codigo-step-up").textContent())?.trim() ?? "";
  await etica.getByLabel("Código de 6 dígitos").fill(code2);
  await etica.getByRole("button", { name: "Botar Ética de la Libertad" }).click();
  await expect(etica.getByRole("status")).toHaveText("Botado");
});
