"use client";

import Link from "next/link";
import { CircleAlert, CircleCheck, Send } from "lucide-react";
import { useActionState } from "react";

import { Badge, Button } from "@/design-system/components";
import { route } from "@/features/shared/format";
import type { PublishState } from "@/app/(app)/catedra/publicar/actions";

import type { PublishItem } from "./publish-items";

/** One activity in the review: what is saved, who is under the threshold, and the one button that publishes it. */
export function PublishRow({
  item,
  action,
}: {
  item: PublishItem;
  action: (prev: PublishState, form: FormData) => Promise<PublishState>;
}) {
  const [state, submit, pending] = useActionState(action, {});
  const lote = route(
    `/catedra/por-calificar?seccion=${item.sectionId}&actividad=${item.activityId}`,
  );
  const publishable = item.guardadas > 0 && !item.cerrada;
  return (
    <li aria-label={item.titulo} className="grid gap-4 py-6 md:grid-cols-[1fr_auto] md:gap-10">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2">
          <span className="text-[17px] font-semibold">{item.titulo}</span>
          {state.ok || item.estado === "publicada" ? (
            <Badge tone="success">Publicada</Badge>
          ) : item.cerrada ? (
            <Badge>Nota final cerrada</Badge>
          ) : item.guardadas === 0 ? (
            <Badge tone="warning">Por calificar</Badge>
          ) : item.sinNota > 0 ? (
            <Badge tone="info">Parcial</Badge>
          ) : (
            <Badge tone="info">Sin publicar</Badge>
          )}
        </p>
        {item.guardadas > 0 && !state.ok && (
          <p className="mt-1.5 text-label text-fg-muted">
            <b className="font-semibold text-fg tabular">{item.guardadas}</b> guardadas sin publicar
            · promedio <b className="font-semibold text-fg tabular">{item.promedio?.toFixed(1)}</b>{" "}
            ·{" "}
            {item.bajo.length === 0
              ? `ninguna bajo ${item.umbral}`
              : `${item.bajo.length} bajo ${item.umbral}`}
          </p>
        )}
        {item.guardadas > 0 && item.sinNota > 0 && !state.ok && (
          <p className="mt-1 text-label text-warning-fg">
            Faltan {item.sinNota} sin nota: se publican solo las guardadas.
          </p>
        )}
        {item.guardadas === 0 && item.estado !== "publicada" && (
          <p className="mt-1.5 text-label text-fg-muted">
            {item.publicadas > 0
              ? `${item.publicadas} publicadas · faltan ${item.sinNota} sin nota`
              : "Aún no hay notas guardadas."}
          </p>
        )}
        {item.estado === "publicada" && !state.ok && (
          <p className="mt-1.5 text-label text-fg-muted">
            {item.publicadas} notas publicadas · promedio{" "}
            <span className="tabular">{item.promedioTotal?.toFixed(1)}</span>
          </p>
        )}
        {item.bajo.length > 0 && !state.ok && (
          <details className="mt-3 text-label">
            <summary className="inline-flex min-h-11 cursor-pointer items-center font-medium underline underline-offset-4">
              {item.bajo.length === 1 ? "Revisar la nota" : `Revisar las ${item.bajo.length} notas`}{" "}
              bajo {item.umbral}
            </summary>
            <ul className="mt-1 divide-y divide-border border-y border-border">
              {item.bajo.map((b) => (
                <li key={b.nombre} className="py-2">
                  <span className="font-medium">{b.nombre}</span>{" "}
                  <span className="tabular">· {b.nota}</span>
                  <span className="block text-fg-muted">{b.justificacion}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
      <div className="flex flex-col items-start gap-2 md:items-end">
        {state.ok && (
          <p
            role="status"
            className="flex items-center gap-1.5 text-label font-medium text-success-fg"
          >
            <CircleCheck aria-hidden="true" className="size-4" />
            {state.ok}
          </p>
        )}
        {state.error && (
          <p role="alert" className="flex items-center gap-1.5 text-label text-danger-fg">
            <CircleAlert aria-hidden="true" className="size-4" />
            {state.error}
          </p>
        )}
        {publishable && !state.ok && (
          <form action={submit}>
            <input type="hidden" name="sectionId" value={item.sectionId} />
            <input type="hidden" name="activityId" value={item.activityId} />
            <Button
              type="submit"
              variant="ink"
              pill
              size="lg"
              loading={pending}
              icon={<Send aria-hidden="true" />}
              aria-label={`Publicar ${item.guardadas} ${item.guardadas === 1 ? "nota" : "notas"} de ${item.titulo}`}
            >
              Publicar {item.guardadas} {item.guardadas === 1 ? "nota" : "notas"}
            </Button>
          </form>
        )}
        {item.enLote && !item.cerrada && (
          <Link
            href={lote}
            className="inline-flex min-h-11 items-center text-label font-medium underline underline-offset-4"
            aria-label={`${item.guardadas === 0 ? "Calificar" : "Abrir el lote de"} ${item.titulo}`}
          >
            {item.guardadas === 0 ? "Calificar" : "Abrir el lote"}
          </Link>
        )}
      </div>
    </li>
  );
}
