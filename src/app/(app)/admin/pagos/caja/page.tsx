import type { Metadata } from "next";
import { Search, UserX } from "lucide-react";

import { requirePermission } from "@/authz/server";
import { Button, EmptyState, PortProblem } from "@/design-system/components";
import { CashRow } from "@/features/admin/cash-row";
import { PagosTabs } from "@/features/admin/pagos-tabs";
import { shortDate } from "@/features/shared/format";
import { withFault } from "@/lib/fault";
import { ledger } from "@/modules/finance";
import { requireActor } from "@/modules/identity/session";

import { cobrarEnCaja } from "./actions";

export const metadata: Metadata = { title: "Caja" };

type Props = { searchParams: Promise<{ carne?: string }> };

/** The cashier: find a student by carné and take what they pay in person. */
export default async function CajaPage({ searchParams }: Props) {
  await requirePermission("approve_payment");
  const actor = await requireActor();
  const carne = ((await searchParams).carne ?? "").trim();
  const found = carne
    ? await withFault("ledger", () => ledger().findCashAccount(actor, carne))
    : null;

  return (
    <div className="pb-10">
      <section className="reveal pt-10 pb-8 md:pt-14 md:pb-10">
        <p className="text-[15px] text-fg-muted">Pagos presenciales</p>
        <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium md:text-[64px]">Caja</h1>
      </section>
      <PagosTabs />
      <form method="get" role="search" className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-label font-medium">
          Carné de la estudiante
          <input
            name="carne"
            defaultValue={carne}
            inputMode="numeric"
            placeholder="2024-0187"
            autoComplete="off"
            className="h-11 w-64 rounded-md border border-border-control bg-surface px-3 font-normal tabular"
          />
        </label>
        <Button type="submit" variant="secondary" pill icon={<Search aria-hidden="true" />}>
          Buscar
        </Button>
      </form>

      <div className="mt-8">
        {found === null ? (
          <p className="text-label text-fg-muted">
            Escribe el carné para ver lo que debe y cobrarlo. Cada cobro queda con tu nombre en la
            auditoría.
          </p>
        ) : !found.ok ? (
          found.error === "not_found" ? (
            <div className="border-y border-border">
              <EmptyState
                icon={<UserX aria-hidden="true" />}
                title="No encontramos ese carné"
                description="Revisa el número. En esta demostración solo existe una cuenta con cargos."
              />
            </div>
          ) : (
            <PortProblem error={found.error} what="la cuenta" className="border-y border-border" />
          )
        ) : (
          <section aria-labelledby="cuenta">
            <h2 id="cuenta" className="display text-[28px] font-medium">
              {found.value.alumno}{" "}
              <span className="text-fg-muted tabular">· {found.value.carne}</span>
            </h2>
            {found.value.pendientes.length === 0 ? (
              <div className="mt-4 border-y border-border">
                <EmptyState
                  icon={<UserX aria-hidden="true" />}
                  title="Sin cargos pendientes"
                  description="Esta estudiante no debe nada en este momento."
                />
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-border border-y border-border">
                {found.value.pendientes.map((c) => (
                  <CashRow
                    key={c.id}
                    carne={found.value.carne}
                    charge={c}
                    vence={shortDate(`${c.vence}T12:00:00-06:00`)}
                    action={cobrarEnCaja}
                  />
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
