import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SERVICES } from "@/features/servicios/catalog";
import { PageHead } from "@/features/servicios/page-head";
import { route } from "@/features/shared/format";
import { requireActor } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Servicios" };

const GROUPS = ["Trámites", "Campus", "Idiomas"] as const;

/** Every service MiU offers, grouped and labeled; external ones say so. */
export default async function ServiciosPage() {
  await requireActor();
  return (
    <div className="pb-10">
      <PageHead kicker="Trámites y servicios del campus" title="Servicios" />
      <div className="grid gap-10 md:grid-cols-3">
        {GROUPS.map((g) => (
          <section key={g} aria-labelledby={`g-${g}`}>
            <h2 id={`g-${g}`} className="border-b border-border pb-2 text-label text-fg-muted">
              {g}
            </h2>
            <ul className="divide-y divide-border">
              {SERVICES.filter((s) => s.grupo === g).map((s) => (
                <li key={s.slug}>
                  <Link
                    href={route(`/servicios/${s.slug}`)}
                    className="-mx-2 flex min-h-16 items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-surface-subtle"
                  >
                    <span>
                      <span className="block font-semibold">{s.titulo}</span>
                      <span className="text-label text-fg-muted">{s.resumen}</span>
                    </span>
                    <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
