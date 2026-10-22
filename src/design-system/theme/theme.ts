export const THEME_COOKIE = "miu-theme";

export const themes = ["system", "light", "dark"] as const;
export type Theme = (typeof themes)[number];

export function parseTheme(value: string | undefined): Theme {
  return themes.find((theme) => theme === value) ?? "system";
}

/** Value for `<html data-theme>`; `undefined` lets the OS preference decide. */
export function themeAttribute(theme: Theme): "light" | "dark" | undefined {
  return theme === "system" ? undefined : theme;
}
