import { expect, test } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, testEmail } from "./helpers";

test("receipts list every payment and paid ones download", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/pagos/recibos");
  const table = page.getByRole("table", { name: "Recibos de pago" });
  await expect(table.getByRole("row")).toHaveCount(5);
  await expect(table).toContainText("En revisión");
  await expectAccessible(page);
  const download = page.waitForEvent("download");
  await page
    .getByRole("link", { name: /^Descargar recibo R-26-/ })
    .first()
    .click();
  expect((await download).suggestedFilename()).toMatch(/^recibo-R-26-\d{6}\.txt$/);
});

test("the statement defaults to the term up to today and refuses an inverted range", async ({
  page,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/pagos/estado-de-cuenta");
  await expect(page.getByLabel("Desde")).toHaveValue("2026-08-03");
  await expect(page.getByLabel("Hasta")).toHaveValue("2026-10-22");
  await expect(page.getByLabel("Hasta")).toHaveAttribute("max", "2026-10-22");
  const rows = page.getByRole("table", { name: /Movimientos del/ }).getByRole("row");
  await expect(rows.filter({ hasText: "Cuota de noviembre" })).toHaveCount(1);
  await expectAccessible(page);

  await page.getByLabel("Desde").fill("2026-10-01");
  await page.getByLabel("Hasta").fill("2026-09-01");
  await page.getByRole("button", { name: "Ver" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "La fecha inicial es posterior a la final" }),
  ).toBeVisible();

  await page.goto("/pagos/estado-de-cuenta?desde=2026-08-03&hasta=2030-01-01");
  await expect(page.getByLabel("Hasta")).toHaveValue("2026-10-22");
});

test("paying at the cashier shows the reference to present", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/pagos/pagar/cuota-noviembre?metodo=caja");
  await expect(page.getByRole("radio", { name: /Pago en caja/ })).toBeChecked();
  await expect(page.getByRole("region", { name: "Pago en caja" })).toContainText("MIU-26-004127");
});
