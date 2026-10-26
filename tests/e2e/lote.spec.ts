import { expect, test } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, switchRole, testEmail } from "./helpers";

test("an Auxiliar grades a batch from the keyboard and publishes it", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "Keyboard flow; mobile is covered by the next test");
  await signIn(page, testEmail(info.project.name));
  await switchRole(page, "auxiliar");
  await page.goto("/catedra/por-calificar");
  await page.getByRole("link", { name: /Actividad 6: closures/ }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Actividad 6: closures" }),
  ).toBeVisible();
  await expect(page.getByText("4 de 24")).toBeVisible();
  await expectAccessible(page);

  const visible = (label: string) => page.getByLabel(label).filter({ visible: true });
  const elena = visible("Nota de Elena Figueroa");
  await elena.focus();
  await elena.fill("50");
  await elena.press("Enter");
  await expect(
    page.getByRole("alert").filter({ hasText: "Bajo 61, explica la nota" }),
  ).toBeVisible();
  const just = visible("Justificación para Elena Figueroa");
  await expect(just).toBeFocused();
  await just.fill("Solo resolvió la primera parte y sin pruebas.");
  await just.press("Enter");
  const row = page.getByRole("row", { name: /Elena Figueroa/ });
  await expect(row.getByText("Guardada")).toBeVisible();

  const fernando = visible("Nota de Fernando García");
  await expect(fernando).toBeFocused();
  await page.keyboard.type("85");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("row", { name: /Fernando García/ }).getByText("Guardada"),
  ).toBeVisible();
  await expect(page.getByText("6 de 24")).toBeVisible();

  await visible("Nota de Gabriela Hernández").press("k");
  await expect(fernando).toBeFocused();

  await page.getByRole("button", { name: "Publicar 6 notas" }).click();
  await expect(
    page.getByRole("row", { name: /Elena Figueroa/ }).getByText("Publicada"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Publicar 0 notas" })).toBeDisabled();
});

test("the Auxiliar only reaches assigned sections; students not at all", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  expect((await page.goto("/catedra/por-calificar"))?.status()).toBe(404);
  await page.goto("/");
  await switchRole(page, "auxiliar");
  await page.goto("/catedra/por-calificar?seccion=md-a&actividad=md-tarea-4");
  await expect(page.getByText("Tu rol no tiene acceso a esto")).toBeVisible();
  await page.goto("/catedra/por-calificar?seccion=md-b&actividad=md-tarea-4");
  await expect(
    page.getByRole("heading", { level: 1, name: "Tarea 4: recurrencias" }),
  ).toBeVisible();
  await expectAccessible(page);
});
