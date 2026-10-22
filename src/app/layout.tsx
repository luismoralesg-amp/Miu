import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";

import { THEME_COOKIE, parseTheme, themeAttribute } from "@/design-system/theme/theme";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MiU", template: "%s · MiU" },
  description: "Portal académico de la Universidad Francisco Marroquín.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9fafb" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Reading cookies makes every page dynamic, which the per-request CSP nonce requires. The theme
  // comes from a cookie so the server renders it directly, without an inline script.
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html lang="es" data-theme={themeAttribute(theme)}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
