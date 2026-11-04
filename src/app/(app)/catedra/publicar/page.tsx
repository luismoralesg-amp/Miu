import type { Metadata } from "next";
import { Lock, PartyPopper } from "lucide-react";

import { requirePermission } from "@/authz/server";
import {
  Badge,
  CourseDot,
  EmptyState,
  PortProblem,
  type CourseSlot,
} from "@/design-system/components";
import { PublishRow } from "@/features/catedra/publish-row";
import { publishItems } from "@/features/catedra/publish-items";
import { PageHead } from "@/features/servicios/page-head";
import { plural } from "@/features/shared/format";
import { withFault } from "@/lib/fault";
import { academic } from "@/modules/academic";
import { assessment, type Batch } from "@/modules/assessment";
import { requireActor } from "@/modules/identity/session";

import { publicarActividad } from "./actions";

export const metadata: Metadata = { title: "Publicar notas" };

/** Review before publishing: for each section, what is saved, who is under the threshold, one button. */
export default async function PublicarPage() {
  await requirePermission("publish_grades");
  const actor = await requireActor();
  const sections = await withFault("academic", () => academic().listTeachingSections(actor));
  const books = sections.ok
    ? await Promise.all(
        sections.value.map((s) =>
          withFault("assessment", () => assessment().getSectionGradebook(actor, s.sectionId)),
        ),
      )
    : [];
  // The batch of every activity that has grades waiting, to show the summary and who is under the threshold.
  const groups = await Promise.all(
    books.map(async (b) => {
      if (!b.ok) return null;
      const batches = new Map<string, Batch>();
      await Promise.all(
        b.value.actividades
          .filter((a) => a.enLote && a.calificadas > a.publicadas)
          .map(async (a) => {
            const res = await withFault("assessment", () =>
              assessment().listBatch(actor, b.value.sectionId, a.id),
            );
            if (res.ok) batches.set(a.id, res.value);
          }),
      );
      return publishItems(b.value, batches);
    }),
  );
  const waiting = groups.reduce(
    (n, g) => n + (g?.filter((i) => i.guardadas > 0 && !i.cerrada).length ?? 0),
    0,
  );

  return (
    <div className="pb-10">
      <PageHead
        kicker={
          sections.ok
            ? waiting === 0
              ? "Nada espera publicación"
              : `${plural(waiting, "actividad espera", "actividades esperan")} publicación`
            : "Cátedra"
        }
        title="Publicar notas"
      />
      {!sections.ok ? (
        <PortProblem
          error={sections.error}
          what="tus secciones"
          className="border-y border-border"
        />
      ) : sections.value.length === 0 ? (
        <div className="border-y border-border">
          <EmptyState
            icon={<PartyPopper aria-hidden="true" />}
            title="Sin secciones asignadas"
            description="Cuando la facultad te asigne una sección, podrás publicar sus notas aquí."
          />
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {sections.value.map((s, i) => {
            const book = books[i];
            const items = groups[i];
            return (
              <section key={s.sectionId} aria-labelledby={`sec-${s.sectionId}`}>
                <h2
                  id={`sec-${s.sectionId}`}
                  className="flex items-center gap-2.5 pb-3 display text-[26px] leading-tight font-medium"
                >
                  <CourseDot slot={s.slot as CourseSlot} />
                  {s.nombre} · {s.seccion}
                  {book?.ok && book.value.cerrada && (
                    <Badge tone="success" icon={<Lock aria-hidden="true" />}>
                      Nota final cerrada
                    </Badge>
                  )}
                </h2>
                {!book?.ok ? (
                  book && (
                    <PortProblem
                      error={book.error}
                      what="las notas"
                      className="border-y border-border"
                    />
                  )
                ) : !items || items.length === 0 ? (
                  <div className="border-y border-border">
                    <EmptyState
                      icon={<PartyPopper aria-hidden="true" />}
                      title="Todo publicado"
                      description="Esta sección no tiene calificaciones en lote por publicar."
                    />
                  </div>
                ) : (
                  <ul className="divide-y divide-border border-y border-border">
                    {items.map((item) => (
                      <PublishRow key={item.activityId} item={item} action={publicarActividad} />
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
