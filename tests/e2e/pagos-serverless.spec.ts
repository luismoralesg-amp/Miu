import { expect, test, type Page } from "@playwright/test";

import { COLD_PORT } from "../../playwright.config";

import { signIn, testEmail } from "./helpers";

/** Its own server: forgetting the mocks' memory must not reach what other tests are doing. */
test.use({ baseURL: `http://localhost:${COLD_PORT}` });

/**
 * Regression for "las pantallas de pago fallan" on https://miu-2026.vercel.app: the checkout the mock
 * provider opened lived in one server instance's memory, and Vercel answered the next request from
 * another one, so `/pagos/checkout/chk_…` was a 404. Each step of the payment now lands on a "new
 * instance" (`/api/dev/cold-start`), and the flow must carry on from what the browser holds.
 */
const coldStart = async (page: Page) =>
  expect((await page.request.post("/api/dev/cold-start")).status()).toBe(200);

test("the whole ACH payment survives a new instance at every step", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/pagos");
  await expect(page.getByText("Q7,387.80").first()).toBeVisible();

  await coldStart(page);
  await page.getByRole("link", { name: "Pagar Q7,387.80 con transferencia ACH" }).click();
  await expect(page).toHaveURL(/\/pagos\/pagar\/cuota-noviembre\?metodo=ach$/);
  await page.getByRole("button", { name: "Pagar Q7,387.80 con transferencia ACH" }).click();

  // The checkout was opened by one instance and is now read by another.
  await expect(page).toHaveURL(/\/pagos\/checkout\/chk_/);
  await coldStart(page);
  await page.reload();
  await expect(page.getByText("Simulación del checkout de Recurrente")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Q7,387.80" })).toBeVisible();

  // The student pays on a third instance, and the receipt is read from a fourth.
  await coldStart(page);
  await page.getByLabel("Tu banco").selectOption("BAC");
  await page.getByRole("button", { name: "Pagar Q7,387.80" }).click();
  await expect(page).toHaveURL(/\/listo\?checkout=chk_/);
  await coldStart(page);
  await page.reload();
  const receipt = page.getByTestId("recibo-pago");
  await expect(receipt.getByRole("heading", { name: "Pagaste Q7,387.80" })).toBeVisible();
  await expect(receipt.getByText(/^R-26-\d{6}$/)).toBeVisible();
  await expect(receipt.getByRole("status")).toContainText("tu solvencia está al día");

  // Pagos, the statement and the receipt download still know about it.
  await coldStart(page);
  await page.goto("/pagos");
  await expect(page.getByRole("heading", { name: "Estás al día" })).toBeVisible();
  const first = page.getByRole("region", { name: "Historial" }).getByRole("listitem").first();
  await expect(first).toContainText("Cuota de noviembre");
  await expect(first).toContainText("Pagado");
  await coldStart(page);
  await page.goto("/pagos/estado-de-cuenta");
  await expect(page.getByText("Pago: Cuota de noviembre")).toBeVisible();
});

test("the card payment keeps its fee when the instance changes between steps", async ({
  page,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/pagos/pagar/cuota-noviembre");
  await page.getByRole("radio", { name: /Tarjeta/ }).check();
  await coldStart(page);
  await page.getByRole("button", { name: "Pagar Q7,722.25 con tarjeta" }).click();
  await coldStart(page);
  await page.getByRole("button", { name: "Pagar Q7,722.25" }).click();
  await coldStart(page);
  await expect(page.getByTestId("recibo-pago")).toContainText("Q334.45");
  await page.reload();
  await expect(page.getByTestId("recibo-pago")).toContainText("Q334.45");
});

test("a transfer with receipt stays in review after a new instance", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/pagos/pagar/cuota-noviembre?metodo=comprobante");
  await page.getByLabel("Banco", { exact: true }).fill("Banco Industrial");
  await page.getByLabel("Número de boleta o transferencia").fill("TRX-77881");
  await page.getByLabel("Comprobante (foto o PDF)").setInputFiles({
    name: "boleta.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 boleta"),
  });
  await coldStart(page);
  await page.getByRole("button", { name: "Enviar comprobante" }).click();
  await expect(page).toHaveURL(/\/pagos\?comprobante=enviado$/);
  await coldStart(page);
  await page.reload();
  // Not just "something is in review": the seed already has a library fine waiting for review.
  const history = page.getByRole("region", { name: "Historial" });
  await expect(
    history.getByRole("listitem").filter({ hasText: "Cuota de noviembre" }),
  ).toContainText("En revisión");
});
