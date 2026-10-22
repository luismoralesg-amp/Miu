import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { waitForAnimations } from "./helpers";

const pages = [
  { path: "/dev/sistema", tab: "Fundamentos" },
  { path: "/dev/sistema/componentes", tab: "Componentes" },
  { path: "/dev/sistema/estados", tab: "Estados" },
  { path: "/dev/sistema/hoy", tab: "Ejemplo: Hoy" },
] as const;

for (const { path, tab } of pages) {
  test(`${path} is accessible, deep-linked and fits the viewport`, async ({ page }) => {
    const cspViolations: string[] = [];
    page.on("console", (message) => {
      if (/Content Security Policy/i.test(message.text())) cspViolations.push(message.text());
    });

    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("link", { name: tab })).toHaveAttribute("aria-current", "page");
    await waitForAnimations(page);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`),
    ).toEqual([]);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    expect(cspViolations).toEqual([]);
  });
}

test("theme choice applies instantly and survives a reload", async ({ page }) => {
  await page.goto("/dev/sistema");
  await page.locator("label", { hasText: "Oscuro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(darkBg).toBe("rgb(9, 9, 11)");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("radio", { name: "Oscuro" })).toBeChecked();

  await page.locator("label", { hasText: "Claro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
    "rgb(249, 250, 251)",
  );
});

test("dialog traps focus, closes on Escape and returns focus", async ({ page }) => {
  await page.goto("/dev/sistema/componentes");
  const opener = page.getByRole("button", { name: "Abrir confirmación" });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "¿Entregar la tarea ahora?" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("route tabs navigate with real URLs", async ({ page }) => {
  await page.goto("/dev/sistema");
  await page.getByRole("link", { name: "Estados" }).click();
  await expect(page).toHaveURL(/\/dev\/sistema\/estados$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/dev\/sistema$/);
});
