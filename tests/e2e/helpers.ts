import { expect, type Page } from "@playwright/test";

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

/** Seeded demo accounts, one per role (src/modules/identity mock users). */
export const DEMO = {
  estudiante: "ana.lopez.demo@ufm.edu",
  maestro: "jorge.castillo.demo@ufm.edu",
  auxiliar: "carlos.mendez.demo@ufm.edu",
  auxiliar2: "sofia.ramirez.demo@ufm.edu",
  administrativo: "rodrigo.aju.demo@ufm.edu",
} as const;

/** Development-only fault injection: the named port answers with this error (src/lib/fault.ts). */
export async function injectFault(page: Page, port: string, error: string) {
  await page
    .context()
    .addCookies([{ name: "miu-falla", value: `${port}:${error}`, url: page.url() }]);
}

export async function clearFault(page: Page) {
  await page.context().clearCookies({ name: "miu-falla" });
}

/**
 * Switches the active role with the development switcher in the account menu. The role travels in
 * the session cookie, so this waits for the browser to receive the new one before going on.
 */
export async function switchRole(
  page: Page,
  role: "estudiante" | "maestro" | "auxiliar" | "administrativo",
) {
  const session = async () =>
    (await page.context().cookies()).find((c) => c.name === "miu-sesion")?.value;
  const before = await session();
  await page.getByRole("button", { name: /^Tu cuenta/ }).click();
  await page.getByLabel("Rol (desarrollo)").selectOption(role);
  await expect.poll(session).not.toBe(before);
  await page.waitForLoadState("networkidle");
}
