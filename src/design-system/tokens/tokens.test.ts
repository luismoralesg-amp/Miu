import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { contrastRatio } from "./contrast";

const css = readFileSync(join(__dirname, "tokens.css"), "utf8");

/** Reads the custom properties declared directly inside the first block that starts with `selector`. */
function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`Missing block ${selector}`);
  const body = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]),
  );
}

const light = block(":root");
const darkFromOs = { ...light, ...block(':root:not([data-theme="light"])') };
const darkChosen = { ...light, ...block(':root[data-theme="dark"]') };

// [foreground, background] pairs that carry text (4.5:1, WCAG 1.4.3).
const textPairs: Array<[string, string]> = [
  ["fg", "bg"],
  ["fg", "surface"],
  ["fg", "surface-subtle"],
  ["fg-muted", "bg"],
  ["fg-muted", "surface"],
  ["fg-muted", "surface-subtle"],
  ["accent-fg", "bg"],
  ["accent-fg", "surface"],
  ["accent-soft-fg", "accent-soft"],
  ["on-accent", "accent-from"],
  ["on-accent", "accent-to"],
  ["info-fg", "surface"],
  ["info-fg", "info-soft"],
  ["success-fg", "surface"],
  ["success-fg", "success-soft"],
  ["warning-fg", "surface"],
  ["warning-fg", "warning-soft"],
  ["danger-fg", "surface"],
  ["danger-fg", "danger-soft"],
  ["on-accent", "danger-fill"],
];

// Non-text UI that must be perceivable (3:1, WCAG 1.4.11).
const uiPairs: Array<[string, string]> = [
  ["focus", "bg"],
  ["focus", "surface"],
  ["border-control", "bg"],
  ["border-control", "surface"],
];

describe.each([
  ["light", light],
  ["dark (OS preference)", darkFromOs],
  ["dark (user choice)", darkChosen],
])("%s theme", (_name, tokens) => {
  it.each(textPairs)("%s on %s reaches 4.5:1", (fg, bg) => {
    expect(contrastRatio(tokens[fg]!, tokens[bg]!)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(uiPairs)("%s on %s reaches 3:1", (fg, bg) => {
    expect(contrastRatio(tokens[fg]!, tokens[bg]!)).toBeGreaterThanOrEqual(3);
  });
});

it("keeps both dark blocks identical", () => {
  expect(block(':root:not([data-theme="light"])')).toEqual(block(':root[data-theme="dark"]'));
});
