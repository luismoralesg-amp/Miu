import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requirePermission } from "@/authz/server";
import { EvaluationForm } from "@/features/conferencias/evaluation-form";
import { cap } from "@/features/shared/format";
import { longDate } from "@/lib/clock";
import { conferences } from "@/modules/conferences";
import { requireActor } from "@/modules/identity/session";

import { evaluar } from "../../actions";

export const metadata: Metadata = { title: "Evaluar conferencia" };

type Props = { params: Promise<{ id: string }> };

/** The evaluation lives in MiU over HTTPS (MiU sent students to an external HTTP form). */
export default async function EvaluacionPage({ params }: Props) {
  await requirePermission("view_academic_record");
  const actor = await requireActor();
  const { id } = await params;
  const c = await conferences().get(actor, id);
  if (!c.ok) notFound();
  return (
    <div className="pt-8 pb-10 md:pt-10">
      <Link
        href="/conferencias/mis-reservas"
        className="inline-flex min-h-11 items-center gap-1.5 text-label font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Mis reservas
      </Link>
      <p className="pt-2 text-[15px] text-fg-muted">
        {cap(longDate(new Date(c.value.fecha)))} · {c.value.ponente}
      </p>
      <h1 className="mt-1 pb-8 display text-[36px] leading-[1.05] font-medium md:text-[52px]">
        {c.value.titulo}
      </h1>
      {c.value.estado === "por_evaluar" ? (
        <EvaluationForm action={evaluar.bind(null, c.value.id)} />
      ) : (
        <p className="rounded-[20px] border border-border p-6 text-[15px]">
          {c.value.estado === "evaluada"
            ? "Ya evaluaste esta conferencia. Gracias."
            : "Esta conferencia no está abierta a evaluación."}
        </p>
      )}
    </div>
  );
}
