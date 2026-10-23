// Shared head setup for Ronda 2 mockups: theme from ?tema=oscuro, Tailwind theme bound to tokens.css.
if (new URLSearchParams(location.search).get("tema") === "oscuro") {
  document.documentElement.classList.add("dark");
}
const theme = document.createElement("style");
theme.type = "text/tailwindcss";
theme.textContent = `
  @custom-variant dark (&:where(.dark, .dark *));
  @theme inline {
    --color-canvas: var(--canvas);
    --color-card: var(--card);
    --color-subtle: var(--subtle);
    --color-line: var(--line);
    --color-ink: var(--ink);
    --color-muted: var(--muted);
    --color-ufm: var(--ufm);
    --color-ufm-deep: var(--ufm-deep);
    --color-ufm-text: var(--ufm-text);
    --color-ufm-soft: var(--ufm-soft);
    --color-ok: var(--ok);
    --color-ok-soft: var(--ok-soft);
    --color-warn: var(--warn);
    --color-warn-soft: var(--warn-soft);
    --color-info: var(--info);
    --color-info-soft: var(--info-soft);
    --shadow-card: var(--shadow);
  }
`;
document.head.appendChild(theme);
