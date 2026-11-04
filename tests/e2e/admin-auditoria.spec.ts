import { expect, test } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, switchRole, testEmail } from "./helpers";

test("an escalated appeal reaches the Administrativo, who decides it, and both steps are audited", async ({
  page,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  await switchRole(page, "maestro");
  await page.goto("/catedra/apelaciones");
  const mine = page.getByRole("listitem", { name: /^Apelación de / });
  await mine
    .getByLabel("Tu respuesta")
    .fill("Lo paso a la administración para una segunda revisión.");
  await mine.getByRole("button", { name: "Escalar a administración" }).click();
  await expect(mine.getByRole("status")).toContainText("Escalada");

  await switchRole(page, "administrativo");
  await page.goto("/admin/apelaciones");
  await expect(
    page.getByRole("heading", { level: 1, name: "Apelaciones escaladas" }),
  ).toBeVisible();
  // The one just escalated and the one that arrived escalated in the seed.
  const cards = page.getByRole("listitem", { name: /^Apelación de / });
  await expect(cards).toHaveCount(2);
  await expectAccessible(page);
  const card = page.getByRole("listitem", { name: "Apelación de Daniel Estrada" });
  await card
    .getByLabel("Tu respuesta")
    .fill("Revisamos el registro del servidor: la nota se mantiene.");
  await expect(card.getByRole("button", { name: "Responder" })).toHaveCount(0);
  await card.getByRole("button", { name: "Resolver…" }).click();
  await card.getByRole("button", { name: "Resolver apelación" }).click();
  await expect(card.getByRole("status")).toContainText("Resuelta");

  await page.goto("/admin/auditoria");
  await expect(page.getByRole("heading", { level: 1, name: "Auditoría" })).toBeVisible();
  await expect(page.getByText(/Escaló la apelación de/).first()).toBeVisible();
  await expect(page.getByText(/Resolvió la apelación de/).first()).toBeVisible();
  await expectAccessible(page);
  await page.getByRole("link", { name: "Apelación", exact: true }).click();
  await expect(page).toHaveURL(/accion=apelacion/);
  await expect(page.getByText(/Resolvió la apelación de/).first()).toBeVisible();
});

test("the Administrativo sees every section's statistics", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  await switchRole(page, "administrativo");
  await page.goto("/admin/estadisticas");
  await expect(page.getByRole("heading", { level: 1, name: "Estadísticas" })).toBeVisible();
  await expect(page.getByText("Promedio general")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /Discreta · A/ })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /Paradigmas/ })).toBeVisible();
  const width = page.viewportSize()!.width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    width,
  );
  await expectAccessible(page);
});

test("the Administrativo's audit, appeals and statistics are closed to everyone else", async ({
  page,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  for (const role of ["estudiante", "maestro", "auxiliar"] as const) {
    await page.goto("/");
    await switchRole(page, role);
    for (const path of ["auditoria", "apelaciones", "estadisticas"])
      expect((await page.goto(`/admin/${path}`))?.status(), `${role} ${path}`).toBe(404);
  }
});
