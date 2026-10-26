"use client";

import { CircleAlert, Landmark, Lock } from "lucide-react";
import { useActionState, useId, useState } from "react";

import { Button } from "@/design-system/components";
import { quetzales } from "@/lib/clock";
import { cx } from "@/lib/cx";
import type { Quote } from "@/modules/payments";
import type { PayState } from "@/app/(app)/pagos/actions";

import { METHOD_COPY, payLabel } from "./methods";

type Method = Quote["metodo"] | "comprobante";

/**
 * Step 1 of 2: pick how to pay. Methods come sorted by what they cost you (ACH first), and the
 * saving is printed on the cheapest. The transfer-with-receipt path is a third, slower option.
 */
export function MethodForm({
  quotes,
  inicial,
  referencia,
  pay,
  upload,
}: {
  quotes: Quote[];
  inicial: Method;
  referencia: string;
  pay: (prev: PayState, form: FormData) => Promise<PayState>;
  upload: (prev: PayState, form: FormData) => Promise<PayState>;
}) {
  const [metodo, setMetodo] = useState<Method>(inicial);
  const [payState, submitPay, paying] = useActionState(pay, {});
  const [upState, submitUpload, uploading] = useActionState(upload, {});
  const id = useId();
  const elegido = quotes.find((q) => q.metodo === metodo);
  const error = metodo === "comprobante" ? upState.error : payState.error;

  return (
    <div className="grid gap-10 md:grid-cols-12">
      <fieldset className="md:col-span-7">
        <legend className="text-label text-fg-muted">Paso 1 de 2 · Elige cómo pagar</legend>
        <div className="mt-4 flex flex-col gap-3">
          {[...quotes.map((q) => q.metodo), "comprobante" as const].map((m) => {
            const q = quotes.find((x) => x.metodo === m);
            const active = metodo === m;
            return (
              <label
                key={m}
                className={cx(
                  "flex cursor-pointer items-start gap-4 rounded-[16px] border p-5 transition-colors duration-150",
                  active ? "border-fg bg-surface" : "border-border hover:bg-surface-subtle",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
                )}
              >
                <input
                  type="radio"
                  name={`${id}-metodo`}
                  value={m}
                  checked={active}
                  onChange={() => setMetodo(m)}
                  className="mt-1 size-4 accent-[var(--fg)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 font-semibold">
                    {m === "comprobante" ? "Transferencia con comprobante" : METHOD_COPY[m].titulo}
                    {q && q.ahorro > 0 && (
                      <span className="rounded-full bg-success-soft px-2 py-0.5 text-caption font-semibold text-success-fg">
                        Ahorras {quetzales(q.ahorro)}
                      </span>
                    )}
                  </span>
                  <span className="block text-label text-fg-muted">
                    {m === "comprobante"
                      ? `Pagas en tu banco con la referencia ${referencia} y subes el comprobante. Revisión de 1 a 2 días hábiles.`
                      : METHOD_COPY[m].detalle}
                  </span>
                </span>
                {q && (
                  <span className="shrink-0 text-right tabular">
                    <span className="block font-semibold">{quetzales(q.total)}</span>
                    <span className="text-caption text-fg-muted">
                      {q.comision > 0
                        ? `incluye ${quetzales(q.comision)} de comisión`
                        : "sin comisión"}
                    </span>
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-4 md:col-span-5">
        {metodo === "comprobante" ? (
          <form
            action={submitUpload}
            className="flex flex-col gap-4 rounded-[20px] border border-border p-6"
          >
            <h2 className="flex items-center gap-2 font-semibold">
              <Landmark aria-hidden="true" className="size-5" />
              Sube tu comprobante
            </h2>
            <label className="flex flex-col gap-1.5 text-label font-medium">
              Banco
              <input
                name="banco"
                required
                className="h-12 rounded-md border border-border-control bg-surface px-3 text-body font-normal"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-label font-medium">
              Número de boleta o transferencia
              <input
                name="boleta"
                required
                className="h-12 rounded-md border border-border-control bg-surface px-3 text-body font-normal tabular"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-label font-medium">
              Comprobante (foto o PDF)
              <input
                name="comprobante"
                type="file"
                accept="image/*,application/pdf"
                required
                className="text-label font-normal"
              />
            </label>
            {error && (
              <p role="alert" className="flex items-start gap-2 text-label text-danger-fg">
                <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {error}
              </p>
            )}
            <Button type="submit" variant="ink" size="lg" loading={uploading} pill>
              Enviar comprobante
            </Button>
          </form>
        ) : (
          elegido && (
            <form
              action={submitPay}
              className="flex flex-col gap-4 rounded-[20px] border border-border p-6"
            >
              <input type="hidden" name="metodo" value={elegido.metodo} />
              <dl className="text-[15px] tabular">
                <div className="flex justify-between border-b border-border py-2">
                  <dt className="text-fg-muted">Monto</dt>
                  <dd>{quetzales(elegido.monto)}</dd>
                </div>
                <div className="flex justify-between border-b border-border py-2">
                  <dt className="text-fg-muted">Comisión</dt>
                  <dd>{elegido.comision > 0 ? quetzales(elegido.comision) : "Sin comisión"}</dd>
                </div>
                <div className="flex justify-between py-2 text-lg font-semibold">
                  <dt>Total</dt>
                  <dd>{quetzales(elegido.total)}</dd>
                </div>
              </dl>
              {error && (
                <p role="alert" className="flex items-start gap-2 text-label text-danger-fg">
                  <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  {error}
                </p>
              )}
              <Button
                type="submit"
                variant={elegido.metodo === "ach" ? "primary" : "ink"}
                size="lg"
                loading={paying}
                pill
              >
                {payLabel(elegido, quetzales)}
              </Button>
              <p className="flex items-start gap-2 text-caption text-fg-muted">
                <Lock aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                Paso 2: pagas en el checkout seguro de Recurrente. MiU nunca ve los datos de tu
                tarjeta o tu banco.
              </p>
            </form>
          )
        )}
      </div>
    </div>
  );
}
