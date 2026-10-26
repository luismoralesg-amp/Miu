"use client";

import { Check, CircleAlert, FileCode, Send } from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";

import { Button, Kbd } from "@/design-system/components";
import { cx } from "@/lib/cx";
import type { Batch, BatchEntry } from "@/modules/assessment";
import type { GradeResult } from "@/app/(app)/catedra/por-calificar/actions";

import { shortDate } from "../shared/format";

type Row = BatchEntry & { draft: string; just: string; error?: string };

const hora = (iso: string) => {
  const d = new Date(new Date(iso).getTime() - 6 * 36e5);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
};

/**
 * Grading a batch from the keyboard: j/k move, digits type the grade, Enter saves and jumps to the
 * next ungraded row. The active row changes without animation (it moves hundreds of times). Under
 * the threshold the justification field appears and is required; every saved grade is audited.
 */
export function BatchGrader({
  batch,
  save,
  publish,
}: {
  batch: Batch;
  save: (input: {
    courseId: string;
    sectionId: string;
    activityId: string;
    studentId: string;
    nota: number;
    justificacion?: string;
  }) => Promise<GradeResult>;
  publish: (
    courseId: string,
    sectionId: string,
    activityId: string,
  ) => Promise<{ ok: true; publicadas: number } | { ok: false; error: string }>;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    batch.entradas.map((e) => ({
      ...e,
      draft: e.nota === null ? "" : String(e.nota),
      just: e.justificacion ?? "",
    })),
  );
  const [active, setActive] = useState(() =>
    Math.max(
      0,
      batch.entradas.findIndex((e) => e.estado === "sin_nota"),
    ),
  );
  const [status, setStatus] = useState("");
  const [pending, start] = useTransition();
  // Desktop table and phone list both exist in the DOM (one is display:none): keep refs apart and
  // always focus the one that is visible.
  const notaRefs = useRef<{
    desk: Array<HTMLInputElement | null>;
    phone: Array<HTMLInputElement | null>;
  }>({
    desk: [],
    phone: [],
  });
  const focusRow = (i: number) => {
    const el = [notaRefs.current.desk[i], notaRefs.current.phone[i]].find(
      (x) => x && x.offsetParent !== null,
    );
    el?.focus();
  };
  const umbral = batch.umbral;

  const patch = (i: number, p: Partial<Row>) =>
    setRows((r) => r.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const below = (r: Row) => r.draft !== "" && Number(r.draft) < umbral;

  const move = (to: number) => {
    const i = Math.max(0, Math.min(rows.length - 1, to));
    setActive(i);
    focusRow(i);
  };

  const saveRow = (i: number) => {
    const r = rows[i]!;
    const nota = Number(r.draft);
    if (r.draft === "" || !Number.isInteger(nota) || nota < 0 || nota > 100) {
      patch(i, { error: "Escribe una nota entera de 0 a 100." });
      return;
    }
    if (nota < umbral && r.just.trim().length < 10) {
      patch(i, { error: `Bajo ${umbral}, explica la nota (al menos 10 caracteres).` });
      window.requestAnimationFrame(() =>
        [...document.querySelectorAll<HTMLInputElement>(`[data-just="${r.studentId}"]`)]
          .find((x) => x.offsetParent !== null)
          ?.focus(),
      );
      return;
    }
    start(async () => {
      const res = await save({
        courseId: batch.curso.id,
        sectionId: batch.sectionId,
        activityId: batch.activity.id,
        studentId: r.studentId,
        nota,
        ...(nota < umbral ? { justificacion: r.just.trim() } : {}),
      });
      if (!res.ok) {
        patch(i, { error: res.error });
        return;
      }
      setRows((all) => {
        const next = all.map((x, j) =>
          j === i
            ? {
                ...x,
                ...res.entry,
                draft: String(nota),
                just: res.entry.justificacion ?? "",
                error: "",
              }
            : x,
        );
        const after = next.findIndex((x, j) => j > i && x.estado === "sin_nota");
        if (after >= 0) {
          setActive(after);
          window.requestAnimationFrame(() => focusRow(after));
        }
        return next;
      });
      setStatus(`Guardada la nota de ${r.nombre}.`);
    });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const t = e.target as HTMLElement;
    const inJust = t.dataset.just !== undefined;
    if (!inJust && (e.key === "j" || e.key === "k")) {
      e.preventDefault();
      move(active + (e.key === "j" ? 1 : -1));
    } else if (e.key === "Enter" && (t.dataset.nota !== undefined || inJust)) {
      e.preventDefault();
      saveRow(active);
    }
  };

  const saved = rows.filter((r) => r.estado === "guardada");
  const graded = rows.filter((r) => r.estado !== "sin_nota");
  const avg = useMemo(
    () =>
      saved.length ? Math.round(saved.reduce((s, r) => s + (r.nota ?? 0), 0) / saved.length) : 0,
    [saved],
  );
  const bajas = saved.filter((r) => (r.nota ?? 100) < umbral).length;

  const notaInput = (r: Row, i: number, view: "desk" | "phone") => (
    <input
      ref={(el) => {
        notaRefs.current[view][i] = el;
      }}
      data-nota=""
      aria-label={`Nota de ${r.nombre}`}
      inputMode="numeric"
      value={r.draft}
      disabled={r.estado === "publicada"}
      onFocus={() => setActive(i)}
      onChange={(e) =>
        patch(i, { draft: e.target.value.replace(/[^\d]/g, "").slice(0, 3), error: "" })
      }
      aria-invalid={Boolean(r.error) || undefined}
      className={cx(
        "rounded-lg border bg-bg text-center display text-xl tabular disabled:opacity-60",
        view === "phone" ? "h-12 w-20" : "h-11 w-20",
        r.error ? "border-danger-fg" : "border-border-control",
      )}
    />
  );
  const justInput = (r: Row, i: number) =>
    below(r) ? (
      <input
        data-just={r.studentId}
        aria-label={`Justificación para ${r.nombre}`}
        value={r.just}
        disabled={r.estado === "publicada"}
        onFocus={() => setActive(i)}
        onChange={(e) => patch(i, { just: e.target.value, error: "" })}
        placeholder={`Obligatoria bajo ${umbral}`}
        className={cx(
          "h-11 w-full min-w-[200px] rounded-lg border bg-bg px-3 text-label",
          r.error ? "border-danger-fg" : "border-border-control",
        )}
      />
    ) : null;
  const estado = (r: Row) =>
    r.estado === "publicada" ? (
      <span className="inline-flex items-center gap-1 text-label text-success-fg">
        <Send aria-hidden="true" className="size-4" />
        Publicada
      </span>
    ) : r.estado === "guardada" ? (
      <span className="inline-flex items-center gap-1 text-label text-success-fg">
        <Check aria-hidden="true" className="size-4" />
        Guardada
      </span>
    ) : (
      <span className="text-label text-fg-muted">Sin nota</span>
    );

  return (
    <div onKeyDown={onKeyDown}>
      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px]">
        <p>
          <span className="display text-[28px] tabular">
            {graded.length} de {rows.length}
          </span>{" "}
          <span className="text-fg-muted">calificadas</span>
        </p>
        <p className="hidden flex-wrap items-center gap-x-3 gap-y-1 text-label text-fg-muted md:flex">
          <span>
            <Kbd>j</Kbd> <Kbd>k</Kbd> moverte
          </span>
          <span>
            <Kbd>0–9</Kbd> nota
          </span>
          <span>
            <Kbd>Enter</Kbd> guardar
          </span>
        </p>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>

      <div className="hidden overflow-x-auto border-y border-border md:block">
        <table className="w-full min-w-[760px] text-left text-[15px] tabular">
          <caption className="sr-only">
            Entregas de {batch.activity.titulo}, sección {batch.seccion}
          </caption>
          <thead className="text-caption text-fg-muted">
            <tr className="border-b border-border">
              <th scope="col" className="py-3 pr-4 pl-3 font-medium">
                Estudiante
              </th>
              <th scope="col" className="py-3 pr-4 font-medium">
                Entregó
              </th>
              <th scope="col" className="py-3 pr-4 font-medium">
                Archivo
              </th>
              <th scope="col" className="w-24 py-3 pr-4 text-right font-medium">
                Nota
              </th>
              <th scope="col" className="py-3 pr-4 font-medium">
                Justificación
              </th>
              <th scope="col" className="py-3 pr-3 font-medium">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r, i) => (
              <tr
                key={r.studentId}
                aria-current={i === active ? "true" : undefined}
                className={cx(i === active && "bg-surface outline-2 -outline-offset-2 outline-fg")}
              >
                <th scope="row" className="py-3 pr-4 pl-3 font-normal">
                  <span className="block font-semibold">{r.nombre}</span>
                  <span className="text-label text-fg-muted">{r.carne}</span>
                </th>
                <td className="py-3 pr-4 text-label">
                  {shortDate(r.fecha)} {hora(r.fecha)}
                  {r.atrasada && (
                    <span className="ml-1 rounded-full bg-warning-soft px-2 py-0.5 text-caption font-semibold text-warning-fg">
                      Atrasada
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4 text-label">
                  <span className="inline-flex items-center gap-1.5">
                    <FileCode aria-hidden="true" className="size-4 text-fg-muted" />
                    {r.archivo}
                  </span>
                </td>
                <td className="py-3 pr-4 text-right">{notaInput(r, i, "desk")}</td>
                <td className="py-3 pr-4">
                  {justInput(r, i)}
                  {r.error && (
                    <p
                      role="alert"
                      className="mt-1 flex items-center gap-1.5 text-caption text-danger-fg"
                    >
                      <CircleAlert aria-hidden="true" className="size-3.5" />
                      {r.error}
                    </p>
                  )}
                </td>
                <td className="py-3 pr-3">{estado(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-border border-y border-border md:hidden">
        {rows.map((r, i) => (
          <li
            key={r.studentId}
            className={cx(
              "flex flex-col gap-3 py-4",
              i === active && "-mx-3 rounded-xl bg-surface px-3",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <span className="min-w-0">
                <span className="block font-semibold">{r.nombre}</span>
                <span className="text-label text-fg-muted">
                  {shortDate(r.fecha)} {hora(r.fecha)}
                  {r.atrasada && " · atrasada"} · {r.archivo}
                </span>
              </span>
              {notaInput(r, i, "phone")}
            </div>
            {justInput(r, i)}
            {r.error && (
              <p role="alert" className="flex items-center gap-1.5 text-caption text-danger-fg">
                <CircleAlert aria-hidden="true" className="size-3.5" />
                {r.error}
              </p>
            )}
            <div className="flex items-center justify-between">
              {estado(r)}
              {r.estado !== "publicada" && (
                <Button size="sm" onClick={() => saveRow(i)} disabled={pending}>
                  Guardar
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="sticky bottom-24 z-20 mt-6 flex flex-col gap-4 rounded-[20px] border border-border bg-surface p-5 shadow-overlay md:bottom-6 md:flex-row md:items-center md:justify-between">
        <p className="text-[15px]">
          {saved.length === 0 ? (
            <span className="text-fg-muted">
              Guarda notas para publicarlas. Los estudiantes reciben un aviso y queda en la
              auditoría.
            </span>
          ) : (
            <>
              Vas a publicar{" "}
              <b className="font-semibold">
                {saved.length} {saved.length === 1 ? "nota" : "notas"}
              </b>{" "}
              · promedio <b className="font-semibold tabular">{avg}</b> · {bajas} bajo {umbral}, con
              justificación.{" "}
              <span className="text-fg-muted">
                Los estudiantes reciben un aviso y queda en la auditoría.
              </span>
            </>
          )}
        </p>
        <Button
          variant="ink"
          size="lg"
          pill
          disabled={saved.length === 0}
          loading={pending}
          icon={<Send aria-hidden="true" />}
          onClick={() =>
            start(async () => {
              const res = await publish(batch.curso.id, batch.sectionId, batch.activity.id);
              if (!res.ok) return setStatus(res.error);
              setRows((all) =>
                all.map((x) => (x.estado === "guardada" ? { ...x, estado: "publicada" } : x)),
              );
              setStatus(`Publicaste ${res.publicadas} ${res.publicadas === 1 ? "nota" : "notas"}.`);
            })
          }
        >
          Publicar {saved.length} {saved.length === 1 ? "nota" : "notas"}
        </Button>
      </div>
    </div>
  );
}
