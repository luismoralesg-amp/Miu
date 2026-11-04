import Link from "next/link";
import { ScrollText } from "lucide-react";

import { Badge, EmptyState, type Tone } from "@/design-system/components";
import { cx } from "@/lib/cx";
import { hhmm } from "@/lib/clock";
import { route, shortDate } from "@/features/shared/format";
import type { AuditAction, AuditEntry } from "@/modules/audit";

export const ACTION_LABEL: Record<AuditAction, { label: string; tone: Tone }> = {
  calificar: { label: "Calificó", tone: "neutral" },
  publicar: { label: "Publicó", tone: "info" },
  cerrar_nota_final: { label: "Cerró la nota final", tone: "success" },
  sobrescribir: { label: "Cambió una nota", tone: "danger" },
  apelacion: { label: "Apelación", tone: "warning" },
  aprobar_pago: { label: "Aprobó un pago", tone: "success" },
  rechazar_pago: { label: "Rechazó un pago", tone: "danger" },
  reembolso: { label: "Reembolsó", tone: "warning" },
  politica: { label: "Cambió una política", tone: "accent" },
  rol: { label: "Cambió un rol", tone: "accent" },
  acceso: { label: "Acceso", tone: "neutral" },
};

/** The append-only trail as a table: when, who, what, and the reason or before/after when there is one. */
export function AuditLog({
  entries,
  base,
  filter,
  actions,
}: {
  entries: AuditEntry[];
  /** The page's own path, to build the filter links. */
  base: string;
  filter: AuditAction | undefined;
  /** Actions worth offering as filters on this screen. */
  actions: AuditAction[];
}) {
  const shown = filter ? entries.filter((e) => e.accion === filter) : entries;
  const chip = (active: boolean) =>
    cx(
      "inline-flex min-h-11 items-center rounded-full border px-4 text-label font-medium transition-colors duration-150",
      active ? "border-fg bg-fg text-bg" : "border-border-strong hover:bg-surface-subtle",
    );
  return (
    <>
      <nav aria-label="Filtrar por acción" className="flex flex-wrap gap-2 pb-6">
        <Link
          href={route(base)}
          className={chip(!filter)}
          aria-current={!filter ? "true" : undefined}
        >
          Todo
        </Link>
        {actions.map((a) => (
          <Link
            key={a}
            href={route(`${base}?accion=${a}`)}
            className={chip(filter === a)}
            aria-current={filter === a ? "true" : undefined}
          >
            {ACTION_LABEL[a].label}
          </Link>
        ))}
      </nav>
      {shown.length === 0 ? (
        <div className="border-y border-border">
          <EmptyState
            icon={<ScrollText aria-hidden="true" />}
            title={filter ? "Nada con este filtro" : "Aún no hay registros"}
            description={
              filter
                ? "Prueba con otra acción o vuelve a ver todo."
                : "Cada nota guardada, publicación y cierre queda aquí con quién lo hizo."
            }
          />
        </div>
      ) : (
        <ol aria-label="Registro" className="divide-y divide-border border-y border-border">
          {shown.map((e) => {
            const d = new Date(e.fecha);
            return (
              <li key={e.id} className="grid gap-1 py-4 md:grid-cols-[9rem_1fr] md:gap-8">
                <p className="text-label text-fg-muted tabular">
                  {shortDate(e.fecha)} · {hhmm(d)}
                </p>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <Badge tone={ACTION_LABEL[e.accion].tone}>{ACTION_LABEL[e.accion].label}</Badge>
                    <span className="font-medium">{e.actorNombre}</span>
                    <span className="text-label text-fg-muted capitalize">{e.rol}</span>
                  </p>
                  <p className="mt-1">{e.detalle}</p>
                  {e.antes !== undefined && e.despues !== undefined && (
                    <p className="mt-0.5 text-label text-fg-muted tabular">
                      {e.antes} → {e.despues}
                    </p>
                  )}
                  {e.motivo && (
                    <p className="mt-0.5 text-label text-fg-muted">Motivo: {e.motivo}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
