import type { Page } from "@playwright/test";

/** Waits for entrance animations to finish so checks see the settled page (looping ones are ignored). */
export async function waitForAnimations(page: Page) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
}

/** A fresh fictitious @ufm.edu account per test, so parallel projects never share devices. */
export function testEmail(tag: string) {
  return `prueba.${tag}.${Date.now()}${Math.floor(Math.random() * 1e4)}@ufm.edu`;
}

/** Signs in through the real code flow, reading the code from the development outbox. */
export async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Correo de la UFM").fill(email);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.waitForURL(/\/login\/codigo$/);
  const code = (await page.getByTestId("codigo-prueba").textContent())?.trim() ?? "";
  await page.getByLabel("Código de 6 dígitos").fill(code);
  await page.waitForURL((url) => url.pathname === "/");
}
