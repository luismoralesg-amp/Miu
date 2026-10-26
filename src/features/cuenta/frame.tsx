import type { ReactNode } from "react";

import { RouteTabs } from "@/design-system/components";

export function CuentaFrame({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <div className="pb-10">
      <section className="reveal pt-10 pb-6 md:pt-14">
        <p className="text-[15px] text-fg-muted">{eyebrow}</p>
        <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium md:text-[64px]">
          {title}
        </h1>
      </section>
      <RouteTabs
        className="mb-8"
        label="Mi cuenta"
        tabs={[
          { href: "/cuenta/informacion", label: "Información" },
          { href: "/cuenta/privacidad", label: "Privacidad" },
          { href: "/cuenta/accesos", label: "Accesos" },
          { href: "/cuenta/dispositivos", label: "Dispositivos" },
          { href: "/cuenta/archivos", label: "Archivos" },
        ]}
      />
      {children}
    </div>
  );
}
