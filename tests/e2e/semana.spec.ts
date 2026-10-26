import { expect, test } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, testEmail } from "./helpers";

test("Semana shows each day's load and exports the schedule", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/semana");
  await expect(
    page.getByRole("heading", { level: 1, name: "Del 19 al 25 de octubre" }),
  ).toBeVisible();
  const today = page.locator('li[aria-current="date"]');
  await expect(today).toContainText("Jueves · hoy");
  await expect(page.getByRole("listitem").filter({ hasText: "Viernes" }).first()).toContainText(
    "Carga pesada",
  );
  await expect(page.getByText("Libre", { exact: true })).toBeVisible();
  await expectAccessible(page);

  const ics = page.waitForEvent("download");
  await page.getByRole("link", { name: "Exportar a mi calendario" }).click();
  const file = await ics;
  expect(file.suggestedFilename()).toBe("horario-miu.ics");
  const text = await (await file.createReadStream()).toArray();
  expect(Buffer.concat(text).toString()).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO,WE,TH");
});

test("Horario puts classes on a real hour axis with the current one marked", async ({
  page,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/semana");
  await page.getByRole("link", { name: "Horario", exact: true }).first().click();
  await expect(page).toHaveURL(/\/horario$/);
  await expect(
    page
      .getByRole("link", { name: /Matemática Discreta, 07:00 a 08:20, D-307, en curso/ })
      .filter({ visible: true }),
  ).toHaveCount(info.project.name === "mobile" ? 0 : 1);
  await expect(page.getByRole("button", { name: "Imprimir" })).toBeVisible();
  await expectAccessible(page);
});
