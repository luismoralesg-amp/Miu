import { writeFileSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

import { signIn, testEmail } from "./helpers";

/**
 * LCP and INP on the production build (the E2E server is `next start`) with a mid-range phone's
 * conditions: 4× slower CPU and a 4G network. Budgets come from docs/ARQUITECTURA_MIU.md §
 * (LCP < 2.5 s, INP < 200 ms); the mock answers fast, so these are an upper bound for the front end
 * itself, not for a real backend. Set PERF_REPORT=1 to write the numbers to docs/etapas/E12.
 */
const LCP_BUDGET = 2500;
const INP_BUDGET = 200;
const PAGES = [
  ["Hoy", "/"],
  ["Cursos", "/cursos"],
  ["Pagos", "/pagos"],
] as const;

async function throttle(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
}

test("LCP and INP of Hoy, Cursos and Pagos stay inside the budget", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "Measured once, on the phone profile");
  test.setTimeout(120_000);
  await signIn(page, testEmail(info.project.name));
  await page.addInitScript(() => {
    const w = window as unknown as { __lcp: number; __inp: number[] };
    w.__lcp = 0;
    w.__inp = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) w.__lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as PerformanceEventTiming[])
        if (e.interactionId) w.__inp.push(e.duration);
    }).observe({ type: "event", durationThreshold: 16, buffered: true } as PerformanceObserverInit);
  });
  await throttle(page);

  const results: Record<string, { lcp: number; inp: number }> = {};
  for (const [name, path] of PAGES) {
    await page.goto(path, { waitUntil: "load" });
    await page.waitForLoadState("networkidle");
    // A few real interactions: open the command palette, type, close it.
    await page.keyboard.press("Control+k");
    await page.getByRole("dialog").waitFor();
    await page.keyboard.type("mat", { delay: 60 });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    const { lcp, inp } = await page.evaluate(() => {
      const w = window as unknown as { __lcp: number; __inp: number[] };
      return { lcp: w.__lcp, inp: w.__inp.length ? Math.max(...w.__inp) : 0 };
    });
    results[name] = { lcp: Math.round(lcp), inp: Math.round(inp) };
    console.log(`${name}: LCP ${Math.round(lcp)} ms · INP ${Math.round(inp)} ms`);
  }
  if (process.env.PERF_REPORT)
    writeFileSync(
      "docs/etapas/E12/rendimiento.json",
      JSON.stringify(
        {
          condiciones: "móvil, CPU 4× más lenta, 4G (1.6 Mbps, 150 ms), build de producción",
          ...results,
        },
        null,
        2,
      ) + "\n",
    );
  for (const [name, r] of Object.entries(results)) {
    expect(r.lcp, `${name} LCP`).toBeGreaterThan(0);
    expect(r.lcp, `${name} LCP`).toBeLessThan(LCP_BUDGET);
    expect(r.inp, `${name} INP`).toBeLessThan(INP_BUDGET);
  }
});
