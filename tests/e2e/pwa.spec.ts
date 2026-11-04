import { expect, test } from "@playwright/test";

import { signIn, testEmail } from "./helpers";

test("the manifest is linked, valid, and its icons load", async ({ page, request }) => {
  await page.goto("/login");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBe("/manifest.webmanifest");
  const res = await request.get(href!);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("manifest+json");
  const manifest = await res.json();
  expect(manifest).toMatchObject({ short_name: "MiU", display: "standalone", lang: "es" });
  for (const icon of manifest.icons)
    expect((await request.get(icon.src)).status(), icon.src).toBe(200);
});

test("the service worker registers, is never cached itself, and shows the offline page", async ({
  page,
  context,
}, info) => {
  test.skip(info.project.name !== "light", "One browser is enough for the worker lifecycle");
  await page.goto("/login");
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  // The worker answers the next load.
  await page.reload();
  expect(await page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  const sw = await page.request.get("/sw.js");
  expect(sw.headers()["cache-control"]).toContain("no-store");

  await context.setOffline(true);
  await page.goto("/login").catch(() => undefined);
  await expect(
    page.getByRole("heading", { level: 1, name: "No hay internet por ahora" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Reintentar" })).toBeVisible();
  await context.setOffline(false);
  await page.getByRole("link", { name: "Reintentar" }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("signed-in pages are never kept in the worker's cache", async ({ page }, info) => {
  test.skip(info.project.name !== "light", "One browser is enough for the worker lifecycle");
  await page.goto("/login");
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await signIn(page, testEmail(info.project.name));
  await page.goto("/notas");
  await page.goto("/pagos");
  const cached = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const name of await caches.keys())
      for (const req of await (await caches.open(name)).keys())
        urls.push(new URL(req.url).pathname);
    return urls;
  });
  expect(cached.length).toBeGreaterThan(0);
  for (const personal of ["/", "/notas", "/pagos", "/bandeja", "/login"])
    expect(cached, personal).not.toContain(personal);
  expect(cached.every((p) => /^\/(_next\/static|fonts|brand|icons)\/|^\/offline\./.test(p))).toBe(
    true,
  );
});
