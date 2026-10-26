import { expect, test } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, testEmail } from "./helpers";

test("FAQ search and a chat that knows who you are and where you came from", async ({
  page,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/soporte?desde=/pagos/pagar/cuota-noviembre");
  await expectAccessible(page);
  await page.getByRole("searchbox", { name: "Buscar en las preguntas" }).fill("comprobante");
  await expect(page.getByText("Subí un comprobante, ¿cuándo se refleja?")).toBeVisible();
  await page.getByLabel("¿Con quién?").selectOption("finanzas");
  await page.getByRole("button", { name: "Abrir el chat" }).click();
  await expect(
    page.getByText(/Soporte ve: .* desde \/pagos\/pagar\/cuota-noviembre/),
  ).toBeVisible();
  await page.getByLabel("Mensaje para Soporte").fill("No me aparece el pago ACH");
  await page.getByRole("button", { name: "Enviar" }).click();
  await expect(page.getByRole("list", { name: "Chat con Soporte" })).toContainText(
    "No me aparece el pago ACH",
  );
});
