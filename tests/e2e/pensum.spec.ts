import { expect, test } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, testEmail } from "./helpers";

test("Pensum shows progress and lights a course's prerequisites on select", async ({
  page,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/pensum");
  await expect(page.getByRole("heading", { level: 1, name: "Pensum" })).toBeVisible();
  await expect(page.getByText("20 de 40")).toBeVisible();
  await expectAccessible(page);

  const node = page
    .getByRole("button", { name: /Paradigmas de Programación/ })
    .filter({ visible: true });
  await node.click();
  await expect(node).toHaveAttribute("aria-pressed", "true");
  const detail = page.getByRole("region", { name: "Curso seleccionado" });
  await expect(detail).toContainText("Necesita Estructuras de datos");
  await expect(detail).toContainText("Abre Compiladores");
  await expect(detail.getByRole("link", { name: "ir al curso" })).toHaveAttribute(
    "href",
    "/cursos/paradigmas-de-programacion",
  );
  await expectAccessible(page);
  await node.click();
  await expect(node).toHaveAttribute("aria-pressed", "false");
});
