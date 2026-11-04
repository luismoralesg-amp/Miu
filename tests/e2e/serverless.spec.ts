import { expect, test, type Page } from "@playwright/test";

import { COLD_PORT, PROD_PORT } from "../../playwright.config";

import { signIn, switchRole, testEmail } from "./helpers";

/** Its own server: forgetting the mocks' memory must not reach what other tests are doing. */
test.use({ baseURL: `http://localhost:${COLD_PORT}` });

/**
 * Vercel answers every request from a possibly new instance, so the demo cannot rely on what one
 * instance remembers. `/api/dev/cold-start` forgets all the mock adapters' memory, as a fresh instance
 * would; each test breaks that memory in the middle of a flow and the flow must carry on.
 */
const coldStart = async (page: Page) =>
  expect((await page.request.post("/api/dev/cold-start")).status()).toBe(200);

test("signed in, Notas, Pagos and the downloads still work on a new instance", async ({
  page,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  await coldStart(page);

  await page.goto("/notas");
  await expect(page.getByRole("heading", { level: 1, name: "Notas" })).toBeVisible();
  await coldStart(page);
  await page.goto("/pagos");
  await expect(page.getByRole("heading", { level: 1, name: "Pagos" })).toBeVisible();
  await expect(page).not.toHaveURL(/\/login/);

  // The downloads answer "Inicia sesión" (401) when the session is gone.
  await coldStart(page);
  const receipt = await page.request.get("/api/recibos/pg-octubre");
  expect(receipt.status()).toBe(200);
  expect(await receipt.text()).toContain("Recibo");
  await coldStart(page);
  expect((await page.request.get("/api/ics/horario")).status()).toBe(200);
});

test("the sign-in code asked on one instance is shown and accepted on another", async ({
  page,
}, info) => {
  await page.goto("/login");
  await page.getByLabel("Correo de la UFM").fill(testEmail(info.project.name));
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.waitForURL(/\/login\/codigo$/);
  const asked = (await page.getByTestId("codigo-prueba").textContent())?.trim();
  await coldStart(page);
  await page.reload();
  expect((await page.getByTestId("codigo-prueba").textContent())?.trim()).toBe(asked);
  await coldStart(page);
  await page.getByLabel("Código de 6 dígitos").fill(asked!);
  await page.waitForURL((url) => url.pathname === "/");
  await coldStart(page);
  await page.goto("/bandeja");
  await expect(page.getByRole("heading", { level: 1, name: "Bandeja" })).toBeVisible();
});

test("the active role and the session survive a new instance, and a forged cookie does not", async ({
  page,
  context,
}, info) => {
  await signIn(page, testEmail(info.project.name));
  await switchRole(page, "maestro");
  await coldStart(page);
  await page.goto("/catedra");
  await expect(page.getByRole("heading", { level: 1, name: "Mis secciones" })).toBeVisible();
  await switchRole(page, "administrativo");
  await coldStart(page);
  await page.goto("/admin/politicas");
  await expect(page.getByRole("heading", { level: 1, name: "Políticas" })).toBeVisible();

  // Someone who builds their own cookie gets nowhere.
  const real = (await context.cookies()).find((c) => c.name === "miu-sesion")!;
  const [body] = real.value.split(".");
  const claims = JSON.parse(Buffer.from(body!, "base64url").toString());
  const forged = Buffer.from(
    JSON.stringify({ ...claims, rol: "administrativo", uid: "u-rodrigo" }),
  ).toString("base64url");
  await context.clearCookies({ name: "miu-sesion" });
  await context.addCookies([
    { name: "miu-sesion", value: `${forged}.firma-falsa`, url: page.url() },
  ]);
  await page.goto("/pagos");
  await expect(page).toHaveURL(/\/login/);
});

test("the cold-start hook does not exist in production", async ({ request }, info) => {
  test.skip(info.project.name !== "light");
  const res = await request.post(`http://localhost:${PROD_PORT}/api/dev/cold-start`);
  expect(res.status()).toBe(404);
});
