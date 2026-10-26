import { expect, test } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, switchRole, testEmail } from "./helpers";

test("the Administrativo approves a student's transfer receipt from another session", async ({
  page,
  browser,
}, info) => {
  const boleta = `TRX-${info.project.name}-${Date.now()}`;
  const student = await browser.newContext();
  const sp = await student.newPage();
  await signIn(sp, testEmail(`${info.project.name}-est`));
  await sp.goto("/pagos/pagar/cuota-noviembre?metodo=comprobante");
  await sp.getByLabel("Banco", { exact: true }).fill("Banco Industrial");
  await sp.getByLabel("Número de boleta o transferencia").fill(boleta);
  await sp.getByLabel("Comprobante (foto o PDF)").setInputFiles({
    name: "boleta.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF"),
  });
  await sp.getByRole("button", { name: "Enviar comprobante" }).click();
  await sp.waitForURL(/comprobante=enviado/);

  await signIn(page, testEmail(`${info.project.name}-adm`));
  await switchRole(page, "administrativo");
  await page.goto("/admin/pagos");
  await expect(page.getByRole("heading", { level: 1, name: "Pagos y conciliación" })).toBeVisible();
  await expectAccessible(page);
  const row = page.getByRole("listitem").filter({ hasText: boleta });
  await row.getByRole("button", { name: "Rechazar…" }).click();
  await row.getByRole("button", { name: "Rechazar", exact: true }).click();
  await expect(row.getByRole("alert")).toContainText("Escribe el motivo del rechazo");
  await row.getByRole("button", { name: "Cancelar" }).click();
  await row.getByRole("button", { name: /^Aprobar comprobante/ }).click();
  await expect(row.getByRole("status")).toContainText("Aprobada");

  await sp.goto("/pagos");
  await expect(sp.getByRole("heading", { name: "Estás al día" })).toBeVisible();
  await expect(
    sp.getByRole("region", { name: "Historial" }).getByRole("listitem").first(),
  ).toContainText("Pagado");
  await student.close();
});

test("students and teachers cannot open the payments queue", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  expect((await page.goto("/admin/pagos"))?.status()).toBe(404);
  await page.goto("/");
  await switchRole(page, "maestro");
  expect((await page.goto("/admin/pagos"))?.status()).toBe(404);
});
