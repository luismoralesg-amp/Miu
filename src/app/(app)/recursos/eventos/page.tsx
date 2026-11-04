import type { Metadata } from "next";

import { PortProblem } from "@/design-system/components";
import { cap } from "@/features/shared/format";
import { PageHead } from "@/features/servicios/page-head";
import { academicNow, hhmm, longDate, relativeDay } from "@/lib/clock";
import { withFault } from "@/lib/fault";
import { directory } from "@/modules/directory";
import { requireActor } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Eventos" };

export default async function EventosPage() {
  await requireActor();
  const now = academicNow();
  const events = await withFault("directory", () => directory().listEvents());
  return (
    <div className="pb-10">
      <PageHead kicker="Lo que pasa en el campus" title="Eventos" />
      {!events.ok ? (
        <PortProblem error={events.error} what="los eventos" className="border-y border-border" />
      ) : (
        <ol aria-label="Próximos eventos" className="divide-y divide-border border-y border-border">
          {events.value.map((e) => {
            const d = new Date(e.fecha);
            return (
              <li key={e.id} className="grid gap-1 py-5 sm:grid-cols-[200px_1fr] sm:gap-6">
                <p className="text-label tabular">
                  <span className="font-semibold">{cap(relativeDay(d, now))}</span>
                  <span className="block text-fg-muted">
                    {longDate(d)} · {hhmm(d)}
                  </span>
                </p>
                <div>
                  <h2 className="display text-[24px] leading-tight font-medium">{e.titulo}</h2>
                  <p className="mt-1 text-label text-fg-muted">
                    {e.tipo} · {e.lugar}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <p className="mt-8 text-caption text-fg-muted">Eventos de ejemplo.</p>
    </div>
  );
}
