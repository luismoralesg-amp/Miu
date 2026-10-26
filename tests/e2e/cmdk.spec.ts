import { expect, test, type Page } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, switchRole, testEmail } from "./helpers";

async function tabTo(page: Page, name: RegExp, max = 40) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    const label = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return el ? (el.getAttribute("aria-label") ?? el.textContent ?? "").trim() : "";
    });
    if (name.test(label)) return;
  }
  throw new Error(`No llegué con Tab a ${name}`);
}

test("keyboard only: open a course and pay a charge from ⌘K", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "Hardware keyboard flow");
  await signIn(page, testEmail(info.project.name));
  const combo = page.getByRole("combobox", { name: "Buscar o hacer algo" });

  await page.keyboard.press("ControlOrMeta+K");
  await expect(combo).toBeFocused();
  await combo.pressSequentially("matematica discreta");
  await expect(page.getByRole("option", { name: /Matemática Discreta/ }).first()).toBeVisible();
  await expectAccessible(page);
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/cursos\/matematica-discreta$/);
  await expect(page.getByRole("heading", { level: 1, name: "Matemática Discreta" })).toBeVisible();

  await page.keyboard.press("ControlOrMeta+K");
  await combo.pressSequentially("pagar cuota");
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/pagos\/pagar\/cuota-noviembre$/);
  await tabTo(page, /^Pagar Q7,387.80 con transferencia ACH$/);
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/pagos\/checkout\//);
  await tabTo(page, /^Pagar Q7,387.80$/);
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/listo\?checkout=/);
  await expect(page.getByRole("heading", { name: "Pagaste Q7,387.80" })).toBeVisible();
});

test("⌘K finds activities and teachers for students, and students for an Auxiliar", async ({
  page,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  const open = async () => {
    await page.getByRole("button", { name: "Buscar o hacer algo" }).click();
    return page.getByRole("combobox", { name: "Buscar o hacer algo" });
  };
  let combo = await open();
  await combo.fill("llaves");
  await expect(page.getByRole("option", { name: /Ejercicio de llaves/ }).first()).toBeVisible();
  await combo.fill("herrera");
  await expect(page.getByRole("option", { name: /^Lucía Herrera/ })).toBeVisible();
  await page.keyboard.press("Escape");

  await switchRole(page, "auxiliar");
  combo = await open();
  await combo.fill("estrada");
  await expect(page.getByRole("option", { name: /Daniel Estrada/ }).first()).toBeVisible();
  await combo.fill("cuota");
  await expect(page.getByRole("option", { name: /Cuota de noviembre/ })).toHaveCount(0);
});
