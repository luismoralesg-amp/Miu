import { expect, test } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, testEmail } from "./helpers";

test("send a message to a teacher from the course page", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/cursos/etica-de-la-libertad");
  await page
    .getByRole("complementary", { name: "Datos del curso" })
    .getByRole("link", { name: "Escribirle" })
    .first()
    .click();
  await expect(page).toHaveURL(/\/comunicacion\?con=p-lucia$/);
  await expect(page.getByRole("heading", { name: /Lucía Herrera/ })).toBeVisible();
  await expectAccessible(page);
  await page
    .getByLabel("Mensaje para Lucía Herrera")
    .fill("¿La lectura del lunes es el capítulo 3 completo?");
  await page.getByRole("button", { name: "Enviar" }).click();
  const list = page.getByRole("list", { name: "Mensajes con Lucía Herrera" });
  await expect(list).toContainText("¿La lectura del lunes es el capítulo 3 completo?");
  await expect(page.getByLabel("Mensaje para Lucía Herrera")).toHaveValue("");
});
