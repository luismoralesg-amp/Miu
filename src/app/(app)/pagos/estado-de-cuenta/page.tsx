import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CircleAlert } from "lucide-react";

import { PortProblem } from "@/design-system/components";
import { requirePermission } from "@/authz/server";
import { PrintButton } from "@/features/horario/print-button";
import { shortDate } from "@/features/shared/format";
import { academicNow, quetzales } from "@/lib/clock";
import { withFault } from "@/lib/fault";
import { academic } from "@/modules/academic";
import { ledger } from "@/modules/finance";
import { requireActor } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Estado de cuenta" };

type Props = { searchParams: Promise<{ desde?: string; hasta?: string }> };

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Statement for a date range. Defaults to the current term up to today (MiU asked for both dates
 * every time); the range never reaches the future.
 */
export default async function EstadoDeCuentaPage({ searchParams }: Props) {
  await requirePermission("view_payments");
  const actor = await requireActor();
  const sp = await searchParams;
  const hoy = new Date(academicNow().getTime() - 6 * 36e5).toISOString().slice(0, 10);
  const term = await academic().getTerm();
  const inicio = term.ok ? term.value.inicio : `${hoy.slice(0, 4)}-01-01`;
  const desde = sp.desde && ISO.test(sp.desde) ? sp.desde : inicio;
  const hasta = sp.hasta && ISO.test(sp.hasta) ? (sp.hasta > hoy ? hoy : sp.hasta) : hoy;
  const invertido = desde > hasta;
  const st = invertido
    ? null
    : await withFault("ledger", () => ledger().getStatement(actor, { desde, hasta }));

  return (
    <div className="pt-8 pb-10 md:pt-10">
      <Link
        href="/pagos"
        className="no-print inline-flex min-h-11 items-center gap-1.5 text-label font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Pagos
      </Link>
      <div className="flex flex-col gap-4 pt-2 pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[15px] text-fg-muted">{actor.nombre}</p>
          <h1 className="mt-1 display text-[40px] leading-[1.02] font-medium md:text-[56px]">
            Estado de cuenta
          </h1>
        </div>
        <div className="no-print">
          <PrintButton />
        </div>
      </div>
      <form
        className="no-print flex flex-wrap items-end gap-3 border-y border-border py-5"
        method="get"
      >
        <label className="flex flex-col gap-1.5 text-label font-medium">
          Desde
          <input
            type="date"
            name="desde"
            defaultValue={desde}
            max={hoy}
            className="h-11 rounded-md border border-border-control bg-surface px-3 font-normal tabular"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-label font-medium">
          Hasta
          <input
            type="date"
            name="hasta"
            defaultValue={hasta}
            max={hoy}
            className="h-11 rounded-md border border-border-control bg-surface px-3 font-normal tabular"
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-11 items-center rounded-full bg-fg px-5 text-label font-semibold text-bg"
        >
          Ver
        </button>
        <p className="w-full text-caption text-fg-muted sm:w-auto sm:pb-3">
          Por defecto: el semestre hasta hoy.
        </p>
      </form>
      {invertido ? (
        <p role="alert" className="mt-6 flex items-center gap-2 text-[15px] text-danger-fg">
          <CircleAlert aria-hidden="true" className="size-5" />
          La fecha inicial es posterior a la final. Cámbialas y vuelve a intentarlo.
        </p>
      ) : !st?.ok ? (
        <PortProblem error={st?.error ?? "unavailable"} what="tu estado de cuenta" />
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-6 py-8 md:grid-cols-3">
            <div>
              <dt className="text-label text-fg-muted">
                Saldo al {shortDate(`${desde}T12:00:00-06:00`)}
              </dt>
              <dd className="mt-1 display text-[32px] tabular">
                {quetzales(st.value.saldoInicial)}
              </dd>
            </div>
            <div>
              <dt className="text-label text-fg-muted">
                Saldo al {shortDate(`${hasta}T12:00:00-06:00`)}
              </dt>
              <dd className="mt-1 display text-[32px] tabular">{quetzales(st.value.saldoFinal)}</dd>
            </div>
          </dl>
          {st.value.movimientos.length === 0 ? (
            <p className="border-t border-border py-6 text-[15px] text-fg-muted">
              Sin movimientos en este rango.
            </p>
          ) : (
            <div
              className="overflow-x-auto focus-visible:outline-2"
              tabIndex={0}
              role="region"
              aria-label="Tabla con desplazamiento horizontal"
            >
              <table className="w-full min-w-[600px] text-left text-[15px] tabular">
                <caption className="sr-only">
                  Movimientos del {desde} al {hasta}
                </caption>
                <thead className="text-caption text-fg-muted">
                  <tr className="border-y border-border">
                    <th scope="col" className="py-3 pr-4 font-medium">
                      Fecha
                    </th>
                    <th scope="col" className="py-3 pr-4 font-medium">
                      Concepto
                    </th>
                    <th scope="col" className="py-3 pr-4 text-right font-medium">
                      Cargo
                    </th>
                    <th scope="col" className="py-3 pr-4 text-right font-medium">
                      Abono
                    </th>
                    <th scope="col" className="py-3 text-right font-medium">
                      Saldo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {st.value.movimientos.map((m, i) => (
                    <tr key={`${m.fecha}-${i}`}>
                      <td className="py-3 pr-4 text-fg-muted">
                        {shortDate(`${m.fecha}T12:00:00-06:00`)}
                      </td>
                      <th scope="row" className="py-3 pr-4 font-normal">
                        {m.concepto}
                      </th>
                      <td className="py-3 pr-4 text-right">
                        {m.cargo !== null ? quetzales(m.cargo) : ""}
                      </td>
                      <td className="py-3 pr-4 text-right text-success-fg">
                        {m.abono !== null ? quetzales(m.abono) : ""}
                      </td>
                      <td className="py-3 text-right font-semibold">{quetzales(m.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
