import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { BrandMark, RouteTabs, ThemeToggle } from "@/design-system/components";
import { THEME_COOKIE, parseTheme } from "@/design-system/theme/theme";

export const metadata: Metadata = {
  title: "Sistema de diseño",
  robots: { index: false, follow: false },
};

/** Developer catalog. Off in production unless MIU_DEV_TOOLS=1 (set for E2E and demos). */
function devToolsEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.MIU_DEV_TOOLS === "1";
}

export default async function DesignSystemLayout({ children }: { children: React.ReactNode }) {
  if (!devToolsEnabled()) notFound();
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-4 pt-6 pb-16 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <BrandMark />
          <span aria-hidden="true" className="h-6 w-px bg-border" />
          <h1 className="text-body font-medium text-fg-muted">Sistema de diseño</h1>
        </div>
        <ThemeToggle initial={theme} />
      </header>
      <RouteTabs
        label="Secciones del sistema de diseño"
        tabs={[
          { href: "/dev/sistema", label: "Fundamentos" },
          { href: "/dev/sistema/componentes", label: "Componentes" },
          { href: "/dev/sistema/estados", label: "Estados" },
          { href: "/dev/sistema/hoy", label: "Ejemplo: Hoy" },
        ]}
      />
      <main className="flex flex-col gap-10">{children}</main>
    </div>
  );
}
