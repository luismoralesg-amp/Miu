import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";

import { PwaRegister } from "@/shell/pwa-register";
import { THEME_COOKIE, parseTheme, themeAttribute } from "@/design-system/theme/theme";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MiU", template: "%s · MiU" },
  description: "Portal académico de la Universidad Francisco Marroquín.",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "MiU", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f2ec" },
    { media: "(prefers-color-scheme: dark)", color: "#11100c" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Reading cookies makes every page dynamic, which the per-request CSP nonce requires. The theme
  // comes from a cookie so the server renders it directly, without an inline script.
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html lang="es" data-theme={themeAttribute(theme)}>
      <body className="font-sans antialiased">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
