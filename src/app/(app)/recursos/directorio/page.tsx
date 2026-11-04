import type { Metadata } from "next";
import { Search, SearchX } from "lucide-react";

import { EmptyState, PortProblem } from "@/design-system/components";
import { PageHead } from "@/features/servicios/page-head";
import { withFault } from "@/lib/fault";
import { directory, MIN_QUERY } from "@/modules/directory";
import { requireActor } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Directorio de personas" };

type Props = { searchParams: Promise<{ q?: string }> };

/**
 * People search. It needs at least three letters so the directory can't be listed whole, and
 * students appear only if they chose to.
 */
export default async function DirectorioPage({ searchParams }: Props) {
  const actor = await requireActor();
  const q = ((await searchParams).q ?? "").slice(0, 80);
  const short = q.trim().length < MIN_QUERY;
  const found = short
    ? null
    : await withFault("directory", () => directory().searchPeople(actor, q));

  return (
    <div className="pb-10">
      <PageHead
        kicker="Catedráticos, personal y estudiantes que aceptaron aparecer"
        title="Directorio"
      />
      <form
        role="search"
        action="/recursos/directorio"
        className="flex flex-col gap-2 pb-8 sm:max-w-md"
      >
        <label className="relative">
          <span className="sr-only">Buscar por nombre</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-fg-muted"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            minLength={MIN_QUERY}
            autoComplete="off"
            placeholder="Nombre o apellido"
            aria-describedby="q-hint"
            className="h-12 w-full rounded-full border border-border-control bg-surface pr-4 pl-11 text-body placeholder:text-fg-muted"
          />
        </label>
        <p id="q-hint" className="px-4 text-caption text-fg-muted">
          Escribe al menos {MIN_QUERY} letras y presiona Enter.
        </p>
      </form>
      {found === null ? (
        q.trim() && (
          <p role="status" className="text-[15px] text-fg-muted">
            Escribe al menos {MIN_QUERY} letras para buscar.
          </p>
        )
      ) : !found.ok ? (
        <PortProblem error={found.error} what="el directorio" className="border-y border-border" />
      ) : found.value.length === 0 ? (
        <div className="border-y border-border">
          <EmptyState
            icon={<SearchX aria-hidden="true" />}
            title={`Nadie coincide con “${q.trim()}”`}
            description="Revisa la ortografía o busca solo por apellido."
          />
        </div>
      ) : (
        <>
          <p role="status" className="pb-3 text-label text-fg-muted">
            {found.value.length} {found.value.length === 1 ? "persona" : "personas"}
          </p>
          <ul aria-label="Resultados" className="divide-y divide-border border-y border-border">
            {found.value.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-0.5 py-3.5 sm:flex-row sm:items-baseline sm:justify-between"
              >
                <span>
                  <span className="font-semibold">{p.nombre}</span>
                  <span className="text-label text-fg-muted"> · {p.rol}</span>
                </span>
                <a href={`mailto:${p.correo}`} className="text-label underline underline-offset-4">
                  {p.correo}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-8 text-caption text-fg-muted">
        Si eres estudiante, decides si apareces desde Mi cuenta · Privacidad.
      </p>
    </div>
  );
}
