import { expect, test } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, testEmail } from "./helpers";

test("documents default to the term, search, and a request appears in process", async ({
  page,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/documentos");
  await expect(page.getByLabel("Desde")).toHaveValue("2026-08-03");
  const docs = page.getByRole("list", { name: "Tus documentos" }).getByRole("listitem");
  await expect(docs).toHaveCount(3);
  await expectAccessible(page);
  await page.getByRole("searchbox", { name: "Buscar" }).fill("solvencia");
  await page.getByRole("button", { name: "Ver" }).click();
  await expect(docs).toHaveCount(1);
  await page.getByLabel("Solicitar un documento").selectOption("certificacion_notas");
  await page.getByRole("button", { name: "Solicitar" }).click();
  await expect(page.getByRole("status")).toContainText("Solicitud recibida");
  await expect(
    page.getByRole("listitem", { name: "Certificación de notas", exact: true }),
  ).toContainText("En proceso");
});
