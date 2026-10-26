"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { Button, CourseDot } from "@/design-system/components";
import { cx } from "@/lib/cx";
import {
  checkPreferences,
  type EnrollmentWindow,
  type OfferCourse,
  type Preference,
} from "@/modules/enrollment";
import { guardarPreferencias, pedirCodigo } from "@/app/(app)/asignacion/actions";

import { AREA_SLOT } from "../pensum/graph";
import { StepUp } from "./step-up";

const DIA = ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const label = (s: OfferCourse["secciones"][number]) =>
  `Sección ${s.seccion} · ${s.dias.map((d) => DIA[d]).join(" y ")} ${s.ini}–${s.fin} · ${s.catedratico}`;

/**
 * Preferences for next term, all on one page: pick courses, rank two sections each, see credits and
 * clashes as you go, then confirm with a code. Nothing is first-come: the batch resolves everyone at
 * the same time.
 */
export function Planner({
  window: w,
  offer,
  saved,
  guardadas,
  formatDate,
}: {
  window: EnrollmentWindow;
  offer: OfferCourse[];
  saved: Preference[];
  guardadas: string | null;
  formatDate: Record<string, string>;
}) {
  const [prefs, setPrefs] = useState<Map<string, string[]>>(
    () => new Map(saved.map((p) => [p.codigo, p.secciones])),
  );
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const list: Preference[] = [...prefs.entries()].map(([codigo, secciones]) => ({
    codigo,
    secciones: secciones.filter(Boolean),
  }));
  const check = useMemo(() => checkPreferences(list, offer, w.maxUma), [list, offer, w.maxUma]);
  const abierta = w.estado === "abierta";
  const set = (codigo: string, i: number, v: string) =>
    setPrefs((m) => {
      const next = new Map(m);
      const cur = [...(next.get(codigo) ?? ["", ""])];
      cur[i] = v;
      next.set(codigo, cur);
      setDone(null);
      return next;
    });
  const toggle = (c: OfferCourse, on: boolean) =>
    setPrefs((m) => {
      const next = new Map(m);
      if (on) next.set(c.codigo, [c.secciones[0]!.id, ""]);
      else next.delete(c.codigo);
      setDone(null);
      return next;
    });
  const clash = (codigo: string) => check.choques.some(([a, b]) => a === codigo || b === codigo);

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <fieldset className="lg:col-span-8" disabled={!abierta}>
        <legend className="sr-only">Cursos que puedes llevar en {w.periodo}</legend>
        <ul className="divide-y divide-border border-y border-border">
          {offer.map((c) => {
            const on = prefs.has(c.codigo);
            const [first = "", second = ""] = prefs.get(c.codigo) ?? [];
            return (
              <li
                key={c.codigo}
                className={cx(
                  "flex flex-col gap-3 py-4",
                  on && clash(c.codigo) && "-mx-3 rounded-lg bg-danger-soft/40 px-3",
                )}
              >
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => toggle(c, e.target.checked)}
                    className="mt-1 size-4 accent-[var(--fg)]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 font-semibold">
                      <CourseDot slot={AREA_SLOT[c.area] ?? 5} />
                      {c.nombre}
                    </span>
                    <span className="text-label text-fg-muted tabular">
                      {c.codigo} · {c.uma} UMA
                    </span>
                  </span>
                </label>
                {on && (
                  <div className="grid gap-3 pl-7 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-label font-medium">
                      1.ª opción
                      <select
                        value={first}
                        onChange={(e) => set(c.codigo, 0, e.target.value)}
                        className="h-11 rounded-md border border-border-control bg-surface px-2 font-normal"
                      >
                        {c.secciones.map((s) => (
                          <option key={s.id} value={s.id}>
                            {label(s)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-label font-medium">
                      2.ª opción, si no hay cupo
                      <select
                        value={second}
                        onChange={(e) => set(c.codigo, 1, e.target.value)}
                        className="h-11 rounded-md border border-border-control bg-surface px-2 font-normal"
                      >
                        <option value="">Ninguna</option>
                        {c.secciones
                          .filter((s) => s.id !== first)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {label(s)}
                            </option>
                          ))}
                      </select>
                    </label>
                    {clash(c.codigo) && (
                      <p
                        className="flex items-center gap-1.5 text-label text-danger-fg sm:col-span-2"
                        role="alert"
                      >
                        <CircleAlert aria-hidden="true" className="size-4" />
                        Choca de horario con{" "}
                        {check.choques
                          .flatMap(([a, b]) => (a === c.codigo ? [b] : b === c.codigo ? [a] : []))
                          .map((x) => offer.find((o) => o.codigo === x)?.nombre)
                          .join(" y ")}
                        .
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </fieldset>

      <aside
        aria-label="Resumen de tu asignación"
        className="flex flex-col gap-4 lg:sticky lg:top-6 lg:col-span-4 lg:self-start"
      >
        <div className="rounded-[20px] border border-border bg-surface p-6">
          <p className="text-label text-fg-muted">Tu selección</p>
          <p className="mt-1 display text-[40px] leading-none tabular">
            {check.uma} <span className="text-[18px] text-fg-muted">de {w.maxUma} UMA</span>
          </p>
          <p className="mt-2 text-label text-fg-muted">
            {list.length} {list.length === 1 ? "curso" : "cursos"}
            {check.excede && <span className="text-danger-fg"> · pasas el límite</span>}
            {check.choques.length > 0 && (
              <span className="text-danger-fg"> · hay choques de horario</span>
            )}
          </p>
          {abierta && !confirming && (
            <Button
              variant="ink"
              size="lg"
              pill
              className="mt-5 w-full"
              disabled={list.length === 0 || check.excede || check.choques.length > 0}
              onClick={() => setConfirming(true)}
            >
              Guardar preferencias
            </Button>
          )}
          {done && (
            <p role="status" className="mt-4 flex items-center gap-2 text-label text-success-fg">
              <CircleCheck aria-hidden="true" className="size-4" />
              Guardadas. Puedes cambiarlas hasta el {formatDate.cierra}.
            </p>
          )}
          {!done && guardadas && (
            <p className="mt-4 text-label text-fg-muted">
              Última vez guardadas: {formatDate.guardadas}.
            </p>
          )}
        </div>
        {confirming && (
          <StepUp
            request={pedirCodigo}
            label="Confirmar y guardar"
            onCancel={() => setConfirming(false)}
            onConfirm={async (codigo) => {
              const r = await guardarPreferencias(list, codigo);
              if (r.error) return r.error;
              setConfirming(false);
              setDone(r.guardadas ?? "");
              return undefined;
            }}
          />
        )}
        <p className="text-caption text-fg-muted">
          La resolución es por lote el {formatDate.resolucion}: todas las preferencias se resuelven
          a la vez, así que no gana quien llega primero. El límite de {w.maxUma} UMA es un valor de
          ejemplo.
        </p>
      </aside>
    </div>
  );
}
