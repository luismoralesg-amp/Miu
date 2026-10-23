import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("sign-in renders with a strict per-request CSP and no violations", async ({ page }) => {
  const cspViolations: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /Content Security Policy/i.test(message.text())) {
      cspViolations.push(message.text());
    }
  });

  const response = await page.goto("/login");
  expect(response?.status()).toBe(200);

  const csp = response?.headers()["content-security-policy"] ?? "";
  expect(csp).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  expect(response?.headers()["x-powered-by"]).toBeUndefined();

  await expect(page.getByRole("heading", { level: 1, name: "Entra a MiU" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  expect(cspViolations).toEqual([]);
});

test("each request gets a different nonce", async ({ request }) => {
  const nonceOf = async () => {
    const response = await request.get("/login");
    return /'nonce-([^']+)'/.exec(response.headers()["content-security-policy"] ?? "")?.[1];
  };
  const first = await nonceOf();
  expect(first).toBeTruthy();
  expect(await nonceOf()).not.toBe(first);
});

test("signed-out visitors are sent to sign in", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("sign-in has no detectable accessibility violations", async ({ page }) => {
  await page.goto("/login");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
