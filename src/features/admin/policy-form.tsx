"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { useActionState, useState } from "react";

import { Button, SelectField, TextField } from "@/design-system/components";
import { quetzales } from "@/lib/clock";
import type { PolicyValues } from "@/modules/policy";
import type { PolicyState } from "@/app/(app)/admin/politicas/actions";

/** Card payment from the mockup: what a charge of this size costs with the fee being edited. */
const EXAMPLE = 7387.8;

/** The editable rules, in three groups; the fee shows its effect on a real charge while you type. */
export function PolicyForm({
  values,
  action,
}: {
  values: PolicyValues;
  action: (prev: PolicyState, form: FormData) => Promise<PolicyState>;
}) {
  const [state, submit, pending] = useActionState(action, {});
  // Controlled, because React resets uncontrolled fields after a submit, even a refused one.
  const [umbral, setUmbral] = useState(String(values.umbralJustificacion));
  const [metas, setMetas] = useState(values.metas.map(String));
  const [pagador, setPagador] = useState(values.comisionTarjeta.pagador);
  const [pct, setPct] = useState(String(values.comisionTarjeta.porcentaje));
  const [fijo, setFijo] = useState(String(values.comisionTarjeta.fijo));
  const fee =
    Number(pct) >= 0 && Number(fijo) >= 0 ? (EXAMPLE * Number(pct)) / 100 + Number(fijo) : null;
  return (
    <form action={submit} className="flex flex-col gap-12">
      <fieldset className="grid gap-5 md:grid-cols-[1fr_minmax(0,28rem)] md:gap-12">
        <div>
          <legend className="display text-[26px] leading-tight font-medium">Notas</legend>
          <p className="mt-1.5 max-w-prose text-label text-fg-muted">
            Bajo el umbral, quien califica debe explicar la nota. Las metas son las que ve el
            estudiante en Notas.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-3 max-w-40">
            <TextField
              name="umbral"
              label="Umbral"
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              step={1}
              value={umbral}
              onChange={(e) => setUmbral(e.target.value)}
              required
            />
          </div>
          {[0, 1, 2].map((i) => (
            <TextField
              key={i}
              name={`meta${i + 1}`}
              label={`Meta ${i + 1}`}
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              step={1}
              value={metas[i] ?? ""}
              onChange={(e) => setMetas((m) => m.map((x, j) => (j === i ? e.target.value : x)))}
              required
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-5 md:grid-cols-[1fr_minmax(0,28rem)] md:gap-12">
        <div>
          <legend className="display text-[26px] leading-tight font-medium">
            Comisión de tarjeta
          </legend>
          <p className="mt-1.5 max-w-prose text-label text-fg-muted">
            Recurrente la cobra por tarjeta y Apple Pay. La transferencia ACH no tiene comisión.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField
            name="porcentaje"
            label="Porcentaje"
            type="number"
            inputMode="decimal"
            min={0}
            max={10}
            step={0.1}
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            required
          />
          <TextField
            name="fijo"
            label="Monto fijo (Q)"
            type="number"
            inputMode="decimal"
            min={0}
            max={50}
            step={0.5}
            value={fijo}
            onChange={(e) => setFijo(e.target.value)}
            required
          />
          <div className="col-span-2">
            <SelectField
              name="pagador"
              label="Quién la paga"
              value={pagador}
              onChange={(e) => setPagador(e.target.value as typeof pagador)}
            >
              <option value="estudiante">La estudiante</option>
              <option value="universidad">La universidad</option>
            </SelectField>
          </div>
          <p aria-live="polite" className="col-span-2 text-label text-fg-muted">
            {fee === null ? (
              "Escribe valores válidos para ver el efecto."
            ) : (
              <>
                Pagar {quetzales(EXAMPLE)} con tarjeta cuesta{" "}
                <b className="font-semibold text-fg tabular">
                  {quetzales(Math.round(fee * 100) / 100)}
                </b>{" "}
                de comisión.
              </>
            )}
          </p>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <Button type="submit" variant="ink" pill size="lg" loading={pending}>
          Guardar políticas
        </Button>
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
      </div>
    </form>
  );
}
