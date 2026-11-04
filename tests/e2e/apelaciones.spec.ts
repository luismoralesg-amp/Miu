import { expect, test } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, switchRole, testEmail } from "./helpers";

test("a Maestro answers an appeal, resolves it with a new grade, and it shows in the audit", async ({
  page,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  await switchRole(page, "maestro");
  await page.goto("/catedra/apelaciones");
  await expect(page.getByRole("heading", { level: 1, name: "Apelaciones" })).toBeVisible();
  const card = page.getByRole("listitem", { name: /^Apelación de / });
  await expect(card).toHaveCount(1);
  await expect(card.getByText("Por responder")).toBeVisible();
  await expect(card.getByText(/contrapositiva/)).toBeVisible();
  await expectAccessible(page);

  // Too short is stopped by the form itself; a real answer goes through.
  await card
    .getByLabel("Tu respuesta")
    .fill("Revisé la pregunta 4 con la rúbrica y el desarrollo.");
  await card.getByRole("button", { name: "Responder" }).click();
  await expect(card.getByRole("status")).toContainText("Respondida");

  // The answer is kept; resolving asks for the decision and, when it changes, the new grade.
  await page.reload();
  await expect(card.getByText("Respuesta: Revisé la pregunta 4")).toBeVisible();
  await card.getByLabel("Tu respuesta").fill("Tienes razón: la contrapositiva es válida aquí.");
  await card.getByRole("button", { name: "Resolver…" }).click();
  await card.getByLabel("Decisión").selectOption("modifica");
  await card.getByLabel("Nota nueva").fill("90");
  await expectAccessible(page);
  await card.getByRole("button", { name: "Resolver apelación" }).click();
  await expect(card.getByRole("status")).toContainText("Resuelta");
  await page.reload();
  await expect(card.getByText("La nota cambió a 90")).toBeVisible();

  // Both decisions are in the audit trail, and the filter narrows it.
  await page.goto("/catedra/auditoria");
  await expect(page.getByRole("heading", { level: 1, name: "Auditoría" })).toBeVisible();
  await expect(page.getByText(/Respondió la apelación de/).first()).toBeVisible();
  await expect(page.getByText(/Resolvió la apelación de/).first()).toBeVisible();
  await expectAccessible(page);
  await page.getByRole("link", { name: "Cambió una nota" }).click();
  await expect(page).toHaveURL(/accion=sobrescribir/);
  await expect(page.getByText(/Respondió la apelación de/)).toHaveCount(0);
  await expect(page.getByText(/→ 90|\d+ → 90/).first()).toBeVisible();
});

test("an Auxiliar sees what they may answer, not resolve; stats are readable", async ({
  page,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  await switchRole(page, "auxiliar");
  await page.goto("/catedra/apelaciones");
  const card = page.getByRole("listitem", { name: /^Apelación de / });
  await expect(card).toHaveCount(1);
  await expect(card.getByText("Escalada", { exact: true })).toBeVisible();
  await expect(card.getByText("Esperando a la administración.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Resolver/ })).toHaveCount(0);
  await expectAccessible(page);

  await page.goto("/catedra/estadisticas");
  await expect(page.getByRole("heading", { level: 1, name: "Estadísticas" })).toBeVisible();
  await expect(page.getByText("Cómo se reparten las notas actuales").first()).toBeVisible();
  await expect(page.getByText("Promedio por actividad").first()).toBeVisible();
  const width = page.viewportSize()!.width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    width,
  );
  await expectAccessible(page);

  // Their own actions only: nothing yet in a fresh account's trail beyond their own.
  await page.goto("/catedra/auditoria");
  await expect(page.getByText("tus acciones")).toBeVisible();
  await expectAccessible(page);
});

test("students and the Administrativo don't reach the teaching screens", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  for (const path of ["apelaciones", "auditoria", "estadisticas"])
    expect((await page.goto(`/catedra/${path}`))?.status(), path).toBe(404);
  await page.goto("/");
  await switchRole(page, "administrativo");
  // The Administrativo works from /admin, not from the teaching screens.
  expect((await page.goto("/catedra/apelaciones"))?.status()).toBe(404);
  expect((await page.goto("/catedra/estadisticas"))?.status()).toBe(404);
});
