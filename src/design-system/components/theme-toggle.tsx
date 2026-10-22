"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";

import { cx } from "@/lib/cx";

import { THEME_COOKIE, themeAttribute, type Theme } from "../theme/theme";

const options: Array<{ value: Theme; label: string; Icon: typeof Sun }> = [
  { value: "system", label: "Sistema", Icon: Monitor },
  { value: "light", label: "Claro", Icon: Sun },
  { value: "dark", label: "Oscuro", Icon: Moon },
];

function applyTheme(theme: Theme) {
  const attribute = themeAttribute(theme);
  if (attribute) document.documentElement.dataset.theme = attribute;
  else delete document.documentElement.dataset.theme;
  const secure = location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax${secure}`;
}

/**
 * The theme switches instantly (no color transition), and the choice is a cookie so the server
 * renders the right theme on the next visit without an inline script.
 * Native radios give arrow-key navigation for free.
 */
export function ThemeToggle({ initial, className }: { initial: Theme; className?: string }) {
  const [theme, setTheme] = useState(initial);

  return (
    <fieldset className={cx("inline-flex rounded-md bg-surface-subtle p-0.5", className)}>
      <legend className="sr-only">Tema</legend>
      {options.map(({ value, label, Icon }) => (
        <label
          key={value}
          className={cx(
            "relative inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-sm px-2.5 text-label font-medium",
            "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus",
            theme === value
              ? "bg-surface text-fg shadow-card dark:shadow-none"
              : "text-fg-muted hover:text-fg",
          )}
        >
          <input
            type="radio"
            name="theme"
            value={value}
            checked={theme === value}
            onChange={() => {
              setTheme(value);
              applyTheme(value);
            }}
            className="sr-only"
          />
          <Icon aria-hidden="true" className="size-4" />
          <span>{label}</span>
        </label>
      ))}
    </fieldset>
  );
}
