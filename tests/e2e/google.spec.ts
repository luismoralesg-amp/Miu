import { expect, test } from "@playwright/test";

/**
 * The E2E servers have no Google credentials, so this is the demo as it runs without them: the Google
 * button is the simulated one, nothing leaves for accounts.google.com and nothing breaks. The real
 * flow (credentials loaded) is covered over HTTP in src/modules/identity/google/google.test.ts.
 */
test("without Google credentials the button signs in the simulated demo student", async ({
  page,
}) => {
  const toGoogle: string[] = [];
  page.on("request", (r) => {
    if (new URL(r.url()).hostname.endsWith("google.com")) toGoogle.push(r.url());
  });
  await page.goto("/login");
  await page.getByRole("button", { name: "Continuar con Google" }).click();
  await page.waitForURL((url) => url.pathname === "/");
  await expect(page.getByRole("button", { name: /Tu cuenta: Ana López/ })).toBeVisible();
  expect(toGoogle).toEqual([]);
});

test("the real-flow routes answer with the login page instead of an error when there are no credentials", async ({
  request,
  page,
}) => {
  const start = await request.get("/login/google/start", { maxRedirects: 0 });
  expect(start.status()).toBe(302);
  expect(new URL(start.headers().location!).pathname).toBe("/login");

  // Google sends the browser back without a request of ours: a refusal with a message, never a 500.
  await page.goto("/login/google/callback?code=x&state=y");
  await expect(page).toHaveURL(/\/login\?google=rechazado$/);
  await expect(page.getByRole("alert")).toContainText("Google no confirmó una cuenta @ufm.edu");
  await page.goto("/login/google/callback?error=access_denied");
  await expect(page).toHaveURL(/\/login\?google=rechazado$/);
});
