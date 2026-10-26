import { expect, test } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, testEmail } from "./helpers";

test("personal data arrives masked; revealing and editing ask for a code", async ({
  page,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/cuenta/informacion");
  await expect(page.getByText("•••• ••••• 0101")).toBeVisible();
  expect(await page.content()).not.toContain("2847 51963");
  await expectAccessible(page);

  await page.getByRole("button", { name: "Mostrar CUI" }).click();
  await page.getByRole("button", { name: "Enviarme el código" }).click();
  const code = (await page.getByTestId("codigo-step-up").textContent())?.trim() ?? "";
  await page.getByLabel("Código de 6 dígitos").fill(code);
  await page.getByRole("button", { name: "Mostrar CUI", exact: true }).last().click();
  await expect(page.getByText("2847 51963 0101")).toBeVisible();

  await page.getByRole("button", { name: "Editar datos de contacto" }).click();
  await page.getByLabel("Teléfono", { exact: true }).fill("5555-1234");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await page.getByRole("button", { name: "Enviarme el código" }).click();
  const code2 = (await page.getByTestId("codigo-step-up").textContent())?.trim() ?? "";
  await page.getByLabel("Código de 6 dígitos").fill(code2);
  await page.getByRole("button", { name: "Confirmar y guardar" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Datos de contacto actualizados" }),
  ).toBeVisible();
  await expect(page.getByText("5555-1234")).toBeVisible();
});

test("privacy is off by default, accesses are listed, Drive needs consent", async ({
  page,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/cuenta/privacidad");
  const dir = page.getByRole("switch", { name: /Aparecer en el directorio/ });
  await expect(dir).toHaveAttribute("aria-checked", "false");
  await expectAccessible(page);
  await dir.click();
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Guardado" })).toBeVisible();

  await page.getByRole("link", { name: "Accesos" }).click();
  await expect(
    page.getByRole("list", { name: "Accesos recientes" }).getByRole("listitem").first(),
  ).toBeVisible();

  await page.getByRole("link", { name: "Archivos" }).click();
  await page.getByRole("button", { name: "Permitir acceso de solo lectura" }).click();
  await expect(
    page.getByRole("list", { name: "Archivos de Drive" }).getByRole("listitem"),
  ).toHaveCount(3);
  await page.getByRole("button", { name: "Quitar el permiso" }).click();
  await expect(page.getByText("MiU no ve tu Drive")).toBeVisible();
});
