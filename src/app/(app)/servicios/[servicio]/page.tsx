import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { buttonClasses } from "@/design-system/components";
import { SERVICES } from "@/features/servicios/catalog";
import { ExternalLink } from "@/features/servicios/external-link";
import { route } from "@/features/shared/format";
import { requireActor } from "@/modules/identity/session";

type Props = { params: Promise<{ servicio: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { servicio } = await params;
  const s = SERVICES.find((x) => x.slug === servicio);
  return { title: s?.titulo ?? "Servicio" };
}

export default async function ServicioPage({ params }: Props) {
  await requireActor();
  const { servicio } = await params;
  const s = SERVICES.find((x) => x.slug === servicio);
  if (!s) notFound();
  return (
    <div className="pt-8 pb-10 md:pt-10">
      <Link
        href="/servicios"
        className="inline-flex min-h-11 items-center gap-1.5 text-label font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Servicios
      </Link>
      <p className="pt-2 text-[15px] text-fg-muted">{s.grupo}</p>
      <h1 className="mt-1 display text-[40px] leading-[1.02] font-medium md:text-[56px]">
        {s.titulo}
      </h1>
      <p className="mt-3 max-w-[60ch] text-body text-fg-muted">{s.resumen}</p>
      {s.estado && (
        <p className="mt-6 rounded-[16px] border border-border bg-surface p-5 text-[15px]">
          {s.estado}
        </p>
      )}
      <h2 className="mt-8 font-semibold">Cómo hacerlo</h2>
      <ol className="mt-3 flex max-w-xl flex-col gap-3 text-[15px]">
        {s.pasos.map((p, i) => (
          <li key={p} className="flex gap-3">
            <span className="w-5 shrink-0 display text-xl leading-6 tabular">{i + 1}</span>
            {p}
          </li>
        ))}
      </ol>
      <div className="mt-8 flex flex-wrap gap-4 text-[15px]">
        {s.interno && (
          <Link
            href={route(s.interno.href)}
            className={buttonClasses({
              variant: "ink",
              pill: true,
              className: "h-11 px-5 text-[15px] font-semibold",
            })}
          >
            {s.interno.label}
          </Link>
        )}
        {s.externo && <ExternalLink href={s.externo.url}>{s.externo.label}</ExternalLink>}
      </div>
      <p className="mt-8 text-caption text-fg-muted">
        Pasos y requisitos de ejemplo hasta que cada oficina los confirme.
      </p>
    </div>
  );
}
