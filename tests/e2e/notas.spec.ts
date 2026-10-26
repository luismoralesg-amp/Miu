import { expect, test } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, testEmail } from "./helpers";

test("consultar notas (PLAN §8 E6)", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/notas");
  await expect(page.getByRole("heading", { level: 1, name: "Notas" })).toBeVisible();
  await expect(page.getByText("84.9", { exact: true })).toBeVisible();
  await expect(page.getByText("El semestre anterior cerraste con 83.8.")).toBeVisible();
  await expect(page.getByRole("table", { name: "Promedio por semestre" })).toBeAttached();

  const md = page.getByRole("button", { name: /Matemática Discreta/ });
  await expect(md).toHaveAttribute("aria-expanded", "true");
  const mdPanel = page.getByRole("region", { name: "Detalle de Matemática Discreta" });
  await expect(mdPanel.getByRole("row", { name: /Quiz 3: lógica/ })).toContainText("90");
  await expectAccessible(page);

  const slider = mdPanel.getByRole("slider");
  await slider.fill("100");
  await expect(mdPanel.getByText("Llegas a 80 y te faltan 3 para 90.")).toBeVisible();

  await md.press("Escape");
  await expect(md).toHaveAttribute("aria-expanded", "false");
  await expect(md).toBeFocused();

  const pp = page.getByRole("button", { name: /Paradigmas de Programación/ });
  await pp.click();
  await expect(
    page
      .getByRole("region", { name: "Detalle de Paradigmas de Programación" })
      .getByRole("row", { name: /Actividad 5/ }),
  ).toContainText("92");
});

test("a deep link opens the course it names", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/notas?curso=bases-de-datos-1");
  await expect(page.getByRole("button", { name: /Bases de Datos I/ })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(page.getByRole("button", { name: /Matemática Discreta/ })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});
