import { expect, test, type Page } from "@playwright/test";

import { signIn, testEmail, waitForAnimations } from "./helpers";

/**
 * Regression for "los mensajes en el teléfono cambian al HUD de PC". Mensajes' grid had no column
 * below `md`, so its one implicit column grew to the widest nowrap preview (624 px on a 375 px screen).
 * The page overflowed sideways, a phone browser shrank the whole page to fit it (`innerWidth` became
 * 652, not 375) and it looked like the desktop layout. `isMobile` makes Chromium honour the viewport
 * meta tag the way a phone does, so that shrinking is reproduced here.
 *
 * One project is enough: the viewport, not the colour scheme, is what is under test.
 */
const VIEWPORTS = [
  { name: "iPhone SE / mini (375×812)", width: 375, height: 812 },
  { name: "iPhone 14 (390×844)", width: 390, height: 844 },
] as const;

/** The layout viewport is the screen's and nothing scrolls sideways. */
async function expectFitsScreen(page: Page, width: number) {
  const m = await page.evaluate(() => ({
    inner: window.innerWidth,
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(m, "a wider layout viewport means something overflowed and the phone zoomed out").toEqual({
    inner: width,
    scroll: width,
    client: width,
  });
}

/** The phone shell: bottom tab bar visible, the desktop bar in the header hidden. */
async function expectMobileShell(page: Page) {
  // `locator`, not `getByRole`: the hidden desktop bar is out of the accessibility tree.
  const bars = page.locator('nav[aria-label="Principal"]');
  await expect(bars).toHaveCount(2);
  await expect(bars.first()).toBeHidden();
  await expect(bars.last()).toBeVisible();
}

for (const vp of VIEWPORTS) {
  test.describe(vp.name, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      isMobile: true,
      hasTouch: true,
    });
    test.beforeEach(({}, info) => test.skip(info.project.name !== "light"));

    test("Mensajes shows the phone layout, with no sideways scroll, in the list and in a thread", async ({
      page,
    }, info) => {
      await signIn(page, testEmail(info.project.name));
      await page.goto("/comunicacion");
      await expect(page.getByRole("heading", { level: 1, name: "Mensajes" })).toBeVisible();
      await waitForAnimations(page);
      await expectFitsScreen(page, vp.width);
      await expectMobileShell(page);

      // Phone: the list and the thread are one screen each, never side by side.
      const list = page.getByRole("navigation", { name: "Conversaciones" });
      await expect(list).toBeVisible();
      await expect(page.getByRole("region", { name: "Conversación" })).toBeVisible();
      const box = await list.boundingBox();
      expect(box!.width).toBeLessThanOrEqual(vp.width);

      await list.getByRole("link").first().click();
      await expect(page).toHaveURL(/\/comunicacion\?con=/);
      await expect(list).toBeHidden();
      await expect(page.getByRole("link", { name: "Todas las conversaciones" })).toBeVisible();
      await waitForAnimations(page);
      await expectFitsScreen(page, vp.width);
      await expectMobileShell(page);

      // A long unbroken word in a message cannot widen the page either.
      await page.getByLabel(/^Mensaje para/).fill(`Hola ${"x".repeat(120)}`);
      await page.getByRole("button", { name: "Enviar" }).click();
      await expect(page.getByRole("list", { name: /^Mensajes con/ })).toContainText("xxxxxxxxxx");
      await expectFitsScreen(page, vp.width);
    });

    test("turning the phone does not break the layout or leave it zoomed out", async ({
      page,
    }, info) => {
      await signIn(page, testEmail(info.project.name));
      await page.goto("/comunicacion");
      await expect(page.getByRole("heading", { level: 1, name: "Mensajes" })).toBeVisible();
      await expectFitsScreen(page, vp.width);

      await page.setViewportSize({ width: vp.height, height: vp.width });
      await expectFitsScreen(page, vp.height);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await expectFitsScreen(page, vp.width);
      await expectMobileShell(page);
    });

    // The same check on every main screen, so Mensajes is not the only one that was looked at.
    const SCREENS = [
      "/",
      "/cursos",
      "/semana",
      "/notas",
      "/pagos",
      "/pagos/pagar/cuota-noviembre",
      "/pagos/estado-de-cuenta",
      "/bandeja",
      "/comunicacion",
      "/horario",
      "/historial",
      "/pensum",
      "/documentos",
      "/conferencias",
      "/servicios",
      "/soporte",
      "/recursos/directorio",
      "/cuenta/informacion",
      "/cuenta/dispositivos",
    ];
    test("no main screen scrolls sideways", async ({ page }, info) => {
      await signIn(page, testEmail(info.project.name));
      for (const path of SCREENS) {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
        await waitForAnimations(page);
        await expect(async () => expectFitsScreen(page, vp.width), path).toPass({ timeout: 2000 });
      }
    });
  });
}
