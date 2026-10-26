import { expect, test } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, testEmail } from "./helpers";

const SUBSECTIONS = [
  "actividades",
  "notas",
  "documentos",
  "anuncios",
  "personas",
  "programa",
  "bibliografia",
  "foro",
  "blog",
  "examenes",
  "enlaces",
  "biblioteca",
  "recursos-ia",
  "actividad-reciente",
];

test("a course opens with what matters first and its line in time", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/cursos");
  await page
    .getByRole("link", { name: /Matemática Discreta/ })
    .filter({ visible: true })
    .click();
  await expect(page).toHaveURL(/\/cursos\/matematica-discreta$/);
  await expect(page.getByRole("heading", { level: 1, name: "Matemática Discreta" })).toBeVisible();
  const aside = page.getByRole("complementary", { name: "Datos del curso" });
  await expect(aside.getByText("77.7")).toBeVisible();
  await expect(aside.getByRole("link", { name: /^Parcial 2/ })).toBeVisible();
  const line = page.getByRole("list", { name: "Línea de tiempo del curso" });
  await expect(line.getByText("Clase de hoy")).toBeVisible();
  await expectAccessible(page);

  await page.getByRole("button", { name: /^Ver 8 elementos anteriores$/ }).click();
  await expect(line.getByText("Parcial 1")).toBeVisible();
  await page.getByRole("button", { name: "Notas", exact: true }).click();
  await expect(page.getByRole("button", { name: "Notas", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(line.getByText("Clase de hoy")).toHaveCount(0);
  await expect(line.getByText("Quiz 3: lógica")).toBeVisible();
});

test("every subsection has its own URL; off and empty read differently", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  for (const sub of SUBSECTIONS) {
    const res = await page.goto(`/cursos/matematica-discreta/${sub}`);
    expect(res?.status(), sub).toBe(200);
    await expect(
      page.locator(`nav[aria-label="Secciones de Discreta"] a[aria-current="page"]`),
    ).toHaveAttribute("href", `/cursos/matematica-discreta/${sub}`);
  }
  await page.goto("/cursos/matematica-discreta/blog");
  await expect(page.getByText("Blog no está habilitado en este curso")).toBeVisible();
  await expectAccessible(page);

  await page.goto("/cursos/etica-de-la-libertad/enlaces");
  await expect(page.getByText("Aún no hay enlaces")).toBeVisible();
  await expectAccessible(page);

  await page.goto("/cursos/paradigmas-de-programacion/personas");
  await expect(page.getByRole("link", { name: /Carlos Méndez/ })).toHaveAttribute(
    "href",
    "/comunicacion?con=p-carlos",
  );

  await page.goto("/cursos/matematica-discreta/documentos");
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Descargar Guía de repaso del Parcial 2" }).click();
  expect((await download).suggestedFilename()).toBe("doc-md-1.txt");

  expect((await page.goto("/cursos/matematica-discreta/nada"))?.status()).toBe(404);
  expect((await page.goto("/cursos/astrofisica"))?.status()).toBe(404);
});
