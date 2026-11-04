import { expect, test } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, switchRole, testEmail } from "./helpers";

test("the Administrativo takes a payment at the cashier and cannot refund their own", async ({
  page,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  await switchRole(page, "administrativo");

  await page.goto("/admin/pagos/caja");
  await expect(page.getByRole("heading", { level: 1, name: "Caja" })).toBeVisible();
  await expectAccessible(page);
  await page.getByLabel("Carné de la estudiante").fill("9999-0000");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByText("No encontramos ese carné").first()).toBeVisible();

  await page.getByLabel("Carné de la estudiante").fill("2024-0187");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByRole("heading", { level: 2, name: /2024-0187/ })).toBeVisible();
  await expectAccessible(page);
  const row = page.getByRole("listitem", { name: /Cuota/ }).first();
  await row.getByRole("button", { name: /^Cobrar .* en caja/ }).click();
  await expect(row.getByRole("status")).toContainText(/Cobrado\. Recibo R-26-/);

  // What they took cannot be refunded by them; a payment from before can, with a reason.
  await page.goto("/admin/pagos/reembolsos");
  await expect(page.getByRole("heading", { level: 1, name: "Reembolsos" })).toBeVisible();
  await expect(page.getByText("Tú lo aprobaste: otra persona debe reembolsarlo")).toBeVisible();
  await expectAccessible(page);
  const octubre = page.getByRole("listitem", { name: /^Cuota de octubre/ });
  await octubre.getByRole("button", { name: /^Reembolsar/ }).click();
  await octubre.getByLabel("Motivo del reembolso").fill("Cobro duplicado confirmado con el banco");
  await octubre.getByRole("button", { name: "Confirmar reembolso" }).click();
  await expect(octubre.getByRole("status")).toContainText("Reembolsado");
  await page.reload();
  await expect(octubre.getByText("Reembolsado", { exact: true })).toBeVisible();
  await expect(octubre.getByText("Motivo: Cobro duplicado")).toBeVisible();
});

test("reconciliation finds what MiU and the provider disagree on", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  await switchRole(page, "administrativo");
  await page.goto("/admin/pagos/conciliacion");
  await expect(page.getByRole("heading", { level: 1, name: "Conciliación" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /Solo en Recurrente/ })).toBeVisible();
  await expect(page.getByText("evt_sin_recibo_4821")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /Conciliados/ })).toBeVisible();
  await expectAccessible(page);
  const width = page.viewportSize()!.width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    width,
  );
});

test("the cashier, reconciliation and refunds are the Administrativo's alone", async ({
  page,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  for (const role of ["estudiante", "maestro", "auxiliar"] as const) {
    await page.goto("/");
    await switchRole(page, role);
    for (const path of ["caja", "conciliacion", "reembolsos"])
      expect((await page.goto(`/admin/pagos/${path}`))?.status(), `${role} ${path}`).toBe(404);
  }
});
