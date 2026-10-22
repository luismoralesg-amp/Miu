import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MiU", template: "%s · MiU" },
  description: "Portal académico de la Universidad Francisco Marroquín.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Reading the request headers makes every page dynamic, which the per-request CSP nonce requires.
  await headers();

  return (
    <html lang="es">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
