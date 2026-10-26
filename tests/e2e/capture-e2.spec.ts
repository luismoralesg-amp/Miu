import { test, type Page } from "@playwright/test";

import { signIn, waitForAnimations } from "./helpers";

/** E2 report screenshots. Skipped unless CAPTURE=E2. */
const stage = process.env.CAPTURE;

test.describe("E2 screenshots", () => {
  test.skip(stage !== "E2", "Set CAPTURE=E2 to take report screenshots");

  const shot = async (page: Page, name: string, project: string, fullPage = true) => {
    await waitForAnimations(page);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `docs/etapas/E2/${name}-${project}.png`, fullPage });
  };

  test("sign-in screens", async ({ page }, info) => {
    await page.goto("/login");
    await shot(page, "login", info.project.name);
    await page.getByLabel("Correo de la UFM").fill("ana.lopez.demo@ufm.edu");
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.waitForURL(/\/login\/codigo$/);
    await shot(page, "login-codigo", info.project.name);
    await page.getByTestId("enlace-prueba").click();
    await page.getByRole("heading", { name: "Confirma que eres tú" }).waitFor();
    await shot(page, "login-enlace", info.project.name);
  });

  test("shell, Más, ⌘K, avisos and devices", async ({ page }, info) => {
    const p = info.project.name;
    await signIn(page, "ana.lopez.demo@ufm.edu");
    await shot(page, "hoy", p);
    const mas = page.getByRole("button", { name: "Más" }).filter({ visible: true });
    await mas.click();
    await shot(page, "mas", p, false);
    await page.keyboard.press("Escape");
    await page.keyboard.press("ControlOrMeta+K");
    await page.getByRole("combobox", { name: "Buscar o hacer algo" }).pressSequentially("pa");
    await shot(page, "cmdk", p, false);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /^Bandeja/ }).click();
    await shot(page, "avisos", p, false);
    await page.keyboard.press("Escape");
    await page.goto("/cuenta/dispositivos");
    await shot(page, "dispositivos", p);
    await page.goto("/conferencias");
    await shot(page, "seccion-pendiente", p);
  });

  test("teaching role from the switcher", async ({ page }, info) => {
    await signIn(page, "ana.lopez.demo@ufm.edu");
    await page.getByRole("button", { name: /^Tu cuenta/ }).click();
    await page.getByLabel("Rol (desarrollo)").selectOption("auxiliar");
    await page.getByRole("link", { name: "Por calificar" }).first().waitFor();
    await shot(page, "rol-auxiliar", info.project.name);
  });
});
