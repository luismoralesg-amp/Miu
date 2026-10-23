import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { signIn, testEmail, waitForAnimations } from "./helpers";

async function expectNoAxeViolations(page: Page) {
  await waitForAnimations(page);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`),
  ).toEqual([]);
}

test("signs in with the 6-digit code", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Buenos días");
  await expect(page.getByRole("navigation", { name: "Principal" }).first()).toBeVisible();
  await expectNoAxeViolations(page);
});

test("rejects addresses outside @ufm.edu inline", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo de la UFM").fill("ana@gmail.com");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByText("Usa tu correo de la UFM, que termina en @ufm.edu.")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("a wrong code says how many attempts are left", async ({ page }, info) => {
  await page.goto("/login");
  await page.getByLabel("Correo de la UFM").fill(testEmail(info.project.name));
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.waitForURL(/\/login\/codigo$/);
  await expectNoAxeViolations(page);
  const real = (await page.getByTestId("codigo-prueba").textContent())?.trim() ?? "";
  const wrong = real === "000000" ? "111111" : "000000";
  await page.getByLabel("Código de 6 dígitos").fill(wrong);
  await expect(page.locator("#codigo-error")).toContainText("Te quedan 4 intentos");
  await expect(page.getByLabel("Código de 6 dígitos")).toHaveAttribute("aria-invalid", "true");
});

test("signs in with the magic link after confirming", async ({ page }, info) => {
  await page.goto("/login");
  await page.getByLabel("Correo de la UFM").fill(testEmail(info.project.name));
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.waitForURL(/\/login\/codigo$/);
  await page.getByTestId("enlace-prueba").click();
  await expect(page.getByRole("heading", { name: "Confirma que eres tú" })).toBeVisible();
  await page.getByRole("button", { name: "Entrar a MiU" }).click();
  await page.waitForURL((url) => url.pathname === "/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Buenos días");
});

test("⌘K runs an action with the keyboard only", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.keyboard.press("ControlOrMeta+K");
  const combo = page.getByRole("combobox", { name: "Buscar o hacer algo" });
  await expect(combo).toBeFocused();
  await combo.pressSequentially("pagar");
  const active = await combo.getAttribute("aria-activedescendant");
  await expect(page.locator(`[id="${active}"]`)).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(`[id="${active}"]`)).toContainText("Pagar mi saldo");
  await expectNoAxeViolations(page);
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/pagos$/);
  await expect(page.getByRole("heading", { level: 1, name: "Pagos" })).toBeVisible();

  await page.keyboard.press("ControlOrMeta+K");
  await page.keyboard.press("Escape");
  await expect(combo).toBeHidden();
});

test("the Más panel reaches every function not in the bar", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  const mas = page.getByRole("button", { name: "Más" }).filter({ visible: true });
  await mas.click();
  const panel = page.getByRole("navigation", { name: "Más secciones" });
  for (const name of [
    "Pensum y mapa de cursos",
    "Conferencias",
    "Asignar y botar cursos",
    "Documentos académicos",
    "Accesos y dispositivos",
    "Soporte y ayuda",
  ]) {
    await expect(panel.getByRole("link", { name })).toBeVisible();
  }
  await panel.getByRole("link", { name: "Conferencias" }).click();
  await expect(page).toHaveURL(/\/conferencias$/);
  await expect(page.getByText("Esta sección se construye en la etapa E8")).toBeVisible();
});

test("revokes another device and ends its session", async ({ page, browser }, info) => {
  const email = testEmail(info.project.name);
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await signIn(otherPage, email);
  await signIn(page, email);

  await page.goto("/cuenta/dispositivos");
  await expectNoAxeViolations(page);
  const rows = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("button", { name: "Cerrar sesión en este dispositivo" }) });
  await expect(rows).toHaveCount(1);
  await rows.getByRole("button", { name: "Cerrar sesión en este dispositivo" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page.getByRole("status").filter({ hasText: "cerramos 1 sesión" })).toBeVisible();
  await expect(rows).toHaveCount(0);

  await otherPage.reload();
  await expect(otherPage).toHaveURL(/\/login$/);
  await other.close();
});
