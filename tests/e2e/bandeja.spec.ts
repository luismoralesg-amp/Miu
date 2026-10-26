import { expect, test } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, testEmail } from "./helpers";

test("the bell's number is the length of the Bandeja, before and after reading", async ({
  page,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  const badge = page.getByTestId("campana-numero");
  const before = Number(await badge.textContent());
  expect(before).toBeGreaterThan(0);

  await page.goto("/bandeja");
  const items = page.getByTestId("bandeja-item");
  await expect(items).toHaveCount(before);
  await expect(page.getByText(`${before} elementos por atender`)).toBeVisible();
  await expectAccessible(page);

  await page
    .getByRole("button", { name: /^Marcar como leído:/ })
    .first()
    .click();
  await expect(items).toHaveCount(before - 1);
  await expect(badge).toHaveText(String(before - 1));
  await expect(
    page.getByRole("button", { name: `Bandeja, ${before - 1} por atender` }),
  ).toBeVisible();
});

test("filters are links and the payment leads to paying", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/bandeja");
  await page.getByRole("link", { name: /^Pagos 1$/ }).click();
  await expect(page).toHaveURL(/\/bandeja\?tipo=pago$/);
  await expect(page.getByRole("link", { name: /^Pagos 1$/ })).toHaveAttribute(
    "aria-current",
    "page",
  );
  const rows = page.getByTestId("bandeja-item");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("Cuota de noviembre");
  await expect(rows.first().getByRole("link")).toHaveAttribute(
    "href",
    "/pagos/pagar/cuota-noviembre",
  );
});

test("marking all notices read leaves pending work and payments", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/bandeja?tipo=aviso");
  await page.getByRole("button", { name: "Marcar todos como leídos" }).click();
  await expect(page.getByText("No hay avisos sin leer.")).toBeVisible();
  await page.goto("/bandeja");
  await expect(page.getByRole("heading", { name: /^Por hacer/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Avisos/ })).toHaveCount(0);
});
