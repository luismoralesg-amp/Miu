import { expect, test } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, testEmail } from "./helpers";

test("pagar y consultar (PLAN §8 E7): ACH first, two steps, receipt, up to date", async ({
  page,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  const badge = Number(await page.getByTestId("campana-numero").textContent());
  await page.goto("/pagos");
  await expect(page.getByText("Q7,387.80").first()).toBeVisible();
  await expect(page.getByText("Q7,722.25").first()).toBeVisible();
  await expect(page.getByText("Q334.45").first()).toBeVisible();
  await expectAccessible(page);

  await page.getByRole("link", { name: "Pagar Q7,387.80 con transferencia ACH" }).click();
  await expect(page).toHaveURL(/\/pagos\/pagar\/cuota-noviembre\?metodo=ach$/);
  await expect(page.getByRole("radio", { name: /Transferencia ACH/ })).toBeChecked();
  await expect(page.getByText("Ahorras Q334.45")).toBeVisible();
  await expectAccessible(page);

  await page.getByRole("button", { name: "Pagar Q7,387.80 con transferencia ACH" }).click();
  await expect(page).toHaveURL(/\/pagos\/checkout\/chk_/);
  await expect(page.getByText("Simulación del checkout de Recurrente")).toBeVisible();
  await page.getByLabel("Tu banco").selectOption("BAC");
  await page.getByRole("button", { name: "Pagar Q7,387.80" }).click();

  await expect(page).toHaveURL(/\/listo\?checkout=chk_/);
  const receipt = page.getByTestId("recibo-pago");
  await expect(receipt.getByRole("heading", { name: "Pagaste Q7,387.80" })).toBeVisible();
  await expect(receipt.getByText(/^R-26-\d{6}$/)).toBeVisible();
  await expect(receipt.getByRole("status")).toContainText("tu solvencia está al día");
  await expect(page.getByTestId("campana-numero")).toHaveText(String(badge - 1));

  await page.getByRole("link", { name: "Volver a Pagos" }).click();
  await expect(page.getByRole("heading", { name: "Estás al día" })).toBeVisible();
  const first = page.getByRole("region", { name: "Historial" }).getByRole("listitem").first();
  await expect(first).toContainText("Cuota de noviembre");
  await expect(first).toContainText("Pagado");
  await page.goto("/bandeja?tipo=pago");
  await expect(page.getByText("No tienes pagos pendientes.")).toBeVisible();
});

test("paying by card adds the fee, paid by the payer [S]", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/pagos/pagar/cuota-noviembre");
  await page.getByRole("radio", { name: /Tarjeta/ }).check();
  await expect(page.getByRole("button", { name: "Pagar Q7,722.25 con tarjeta" })).toBeVisible();
  await page.getByRole("button", { name: "Pagar Q7,722.25 con tarjeta" }).click();
  await page.getByRole("button", { name: "Pagar Q7,722.25" }).click();
  await expect(page.getByTestId("recibo-pago")).toContainText("Q334.45");
});

test("a transfer with receipt goes to review", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/pagos/pagar/cuota-noviembre?metodo=comprobante");
  await page.getByLabel("Banco", { exact: true }).fill("Banco Industrial");
  await page.getByLabel("Número de boleta o transferencia").fill("TRX-77881");
  await page.getByLabel("Comprobante (foto o PDF)").setInputFiles({
    name: "boleta.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 boleta"),
  });
  await page.getByRole("button", { name: "Enviar comprobante" }).click();
  await expect(page).toHaveURL(/\/pagos\?comprobante=enviado$/);
  await expect(
    page.getByRole("status").filter({ hasText: "Recibimos tu comprobante" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Historial" }).getByRole("listitem").first(),
  ).toContainText("En revisión");
});

test("the webhook refuses an unsigned event", async ({ request }) => {
  const res = await request.post("/api/webhooks/recurrente", {
    data: { id: "evt_x", tipo: "checkout.paid" },
    headers: { "x-recurrente-signature": "0".repeat(64) },
  });
  expect(res.status()).toBe(401);
});
