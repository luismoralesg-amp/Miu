import { expect, test } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, testEmail } from "./helpers";

test("Cursos: search without accents, sort, and a shareable URL", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/cursos");
  await expect(page.getByRole("heading", { level: 1, name: "Cursos" })).toBeVisible();
  await expect(page.getByText("Semestre 2026-2 · 4 cursos · 15 créditos")).toBeVisible();
  await expectAccessible(page);

  const search = page.getByRole("searchbox", { name: "Buscar en tus cursos" });
  await search.fill("etica");
  await expect(page).toHaveURL(/\?q=etica$/);
  await expect(page.getByRole("status").filter({ hasText: "1 curso coincide" })).toBeVisible();
  const visibleLinks = page
    .getByRole("link", { name: /Ética de la Libertad/ })
    .filter({ visible: true });
  await expect(visibleLinks).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: /Matemática Discreta/ }).filter({ visible: true }),
  ).toHaveCount(0);

  await search.fill("astrofísica");
  await expect(page.getByText("Ningún curso coincide con “astrofísica”")).toBeVisible();
  await page.getByRole("button", { name: "Limpiar búsqueda" }).click();
  await expect(page).toHaveURL(/\/cursos$/);

  await page.getByLabel("Ordenar por").selectOption("nota");
  await expect(page).toHaveURL(/orden=nota/);
  const first = page
    .getByRole("link", { name: /Paradigmas de Programación|Matemática Discreta|Bases de Datos I/ })
    .filter({ visible: true })
    .first();
  await expect(first).toContainText("Paradigmas de Programación");

  await page.reload();
  await expect(page.getByLabel("Ordenar por")).toHaveValue("nota");
});
