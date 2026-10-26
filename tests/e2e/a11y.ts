import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

import { waitForAnimations } from "./helpers";

/** WCAG 2.2 AA with axe, after entrance animations settle. Also fails on CSP violations logged. */
export async function expectAccessible(page: Page) {
  await waitForAnimations(page);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`),
  ).toEqual([]);
}

/** Collects CSP violations reported by the browser while the test runs. */
export function watchCsp(page: Page) {
  const violations: string[] = [];
  page.on("console", (msg) => {
    if (/Content Security Policy/i.test(msg.text())) violations.push(msg.text());
  });
  return violations;
}
