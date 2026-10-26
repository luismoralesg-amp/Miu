import type { Metadata } from "next";
import Link from "next/link";

import { PortProblem } from "@/design-system/components";
import { requirePermission } from "@/authz/server";
import { HistoryView } from "@/features/historial/history-view";
import { withFault } from "@/lib/fault";
import { academic } from "@/modules/academic";
import { requireActor } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Historial de cursos" };

/** Previous terms, newest first, with one search over all of them. */
export default async function HistorialPage() {
  await requirePermission("view_academic_record");
  const actor = await requireActor();
  const past = await withFault("academic", () => academic().listPastEnrollments(actor));
  return (
    <div className="pb-10">
      <section className="reveal pt-10 pb-8 md:pt-14 md:pb-10">
        <p className="text-[15px] text-fg-muted">
          Cursos aprobados en períodos anteriores · el período actual está en{" "}
          <Link href="/cursos" className="underline underline-offset-4">
            Cursos
          </Link>
        </p>
        <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium md:text-[64px]">
          Historial
        </h1>
      </section>
      {past.ok ? (
        <HistoryView courses={past.value} />
      ) : (
        <PortProblem error={past.error} what="tu historial" className="border-y border-border" />
      )}
    </div>
  );
}
