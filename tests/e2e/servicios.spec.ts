import { expect, test } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, testEmail } from "./helpers";

test("services hub, a service's steps, and external links that say they leave MiU", async ({
  page,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/servicios");
  await expectAccessible(page);
  await page.getByRole("link", { name: /Parqueo/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Parqueo" })).toBeVisible();
  await expectAccessible(page);
  await page.goto("/servicios/duolingo");
  const out = page.getByRole("link", { name: /Abrir Duolingo English Test.*se abre fuera de MiU/ });
  await expect(out).toHaveAttribute("target", "_blank");
  await expect(out).toHaveAttribute("rel", /noopener/);
});

test("the directory needs three letters before it searches", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/recursos/directorio?q=jo");
  await expect(page.getByRole("status")).toHaveText("Escribe al menos 3 letras para buscar.");
  await expect(page.getByRole("list", { name: "Resultados" })).toHaveCount(0);
  const box = page.getByRole("searchbox", { name: "Buscar por nombre" });
  await box.fill("jorge");
  await box.press("Enter");
  await expect(page).toHaveURL(/q=jorge/);
  await expect(page.getByRole("list", { name: "Resultados" })).toContainText("Jorge");
  await expectAccessible(page);
});

for (const [path, h1] of [
  ["/recursos/oficinas", "Oficinas"],
  ["/recursos/eventos", "Eventos"],
  ["/recursos/marca", "Logotipos y fondos"],
  ["/recursos/chatgpt-edu", "ChatGPT Edu"],
] as const) {
  test(`${path} renders accessibly`, async ({ page }, info) => {
    await signIn(page, testEmail(info.project.name));
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: h1 })).toBeVisible();
    await expectAccessible(page);
  });
}
