import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Hammer } from "lucide-react";

import { EmptyState } from "@/design-system/components";
import { requireUser } from "@/modules/identity/session";
import { SECTIONS, sectionAllowed, sectionByPath, sectionKeyByPath } from "@/shell/navigation";

type Params = { params: Promise<{ seccion: string[] }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const section = sectionByPath(`/${(await params).seccion.join("/")}`);
  return { title: section?.titulo ?? "No encontrado" };
}

/**
 * Every section already has its real URL (deep links work from day one). Sections not built yet say
 * which stage builds them; unknown paths are a real 404.
 */
export default async function SectionPlaceholder({ params }: Params) {
  const key = sectionKeyByPath(`/${(await params).seccion.join("/")}`);
  const { rol } = await requireUser();
  if (!key || !sectionAllowed(rol, key)) notFound();
  const section = SECTIONS[key];
  return (
    <div className="py-10 md:py-14">
      <h1 className="display text-[40px] leading-[1.02] font-medium md:text-[56px]">
        {section.titulo}
      </h1>
      <p className="mt-3 max-w-[60ch] text-body text-fg-muted">{section.descripcion}</p>
      <div className="mt-10 border-y border-border">
        <EmptyState
          reason="disabled"
          icon={<Hammer aria-hidden="true" />}
          title={`Esta sección se construye en la etapa ${section.etapa}`}
          description="La dirección ya existe para que los enlaces y ⌘K funcionen desde ahora."
        />
      </div>
    </div>
  );
}
