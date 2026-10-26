import { expect, test } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, testEmail } from "./helpers";

test("Historial groups by term and searches across all of them", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/historial");
  const headings = page.getByRole("heading", { level: 2 });
  await expect(headings).toHaveText(["2026-1", "2025-2", "2025-1", "2024-2"]);
  await expectAccessible(page);
  await page.getByRole("searchbox", { name: "Buscar en tu historial" }).fill("calculo");
  await expect(page.getByRole("status").filter({ hasText: "2 cursos" })).toBeVisible();
  await expect(headings).toHaveText(["2025-1", "2024-2"]);
  await page.getByRole("searchbox", { name: "Buscar en tu historial" }).fill("quimica");
  await expect(page.getByText("Nada coincide con “quimica”")).toBeVisible();
});
