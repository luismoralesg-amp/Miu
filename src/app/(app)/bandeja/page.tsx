import type { Metadata } from "next";
import Link from "next/link";
import { Check, PartyPopper } from "lucide-react";

import { CourseDot, EmptyState, PortProblem, type CourseSlot } from "@/design-system/components";
import { cap, dueLabel, plural, route } from "@/features/shared/format";
import { academicNow, timeAgo } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { withFault } from "@/lib/fault";
import { requireActor } from "@/modules/identity/session";
import { inbox, type InboxItem, type InboxKind } from "@/modules/inbox";
import { InboxIcon } from "@/features/shared/inbox-icon";

import { leerAviso, leerTodo } from "./actions";

export const metadata: Metadata = { title: "Bandeja" };

const GROUPS: Array<{ tipo: InboxKind; titulo: string; vacio: string }> = [
  { tipo: "pago", titulo: "Pagos", vacio: "No tienes pagos pendientes." },
  { tipo: "pendiente", titulo: "Por hacer", vacio: "Nada pendiente en las próximas dos semanas." },
  { tipo: "aviso", titulo: "Avisos", vacio: "No hay avisos sin leer." },
];
const FILTERS: Array<{ tipo: InboxKind | null; label: string }> = [
  { tipo: null, label: "Todo" },
  { tipo: "pendiente", label: "Por hacer" },
  { tipo: "aviso", label: "Avisos" },
  { tipo: "pago", label: "Pagos" },
];

type Props = { searchParams: Promise<{ tipo?: string }> };

/** One list for everything that needs you; the bell's number is exactly its length. */
export default async function BandejaPage({ searchParams }: Props) {
  const actor = await requireActor();
  const now = academicNow();
  const tipoParam = (await searchParams).tipo;
  const filtro = FILTERS.find((f) => f.tipo === tipoParam)?.tipo ?? null;
  const box = await withFault("inbox", () => inbox().listItems(actor));

  return (
    <div className="pb-10">
      <section className="reveal pt-10 pb-8 md:pt-14 md:pb-10">
        <p className="text-[15px] text-fg-muted" aria-live="polite">
          {box.ok
            ? box.value.total
              ? `${plural(box.value.total, "elemento", "elementos")} por atender`
              : "Todo al día"
            : "Bandeja"}
        </p>
        <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium md:text-[64px]">
          Bandeja
        </h1>
      </section>

      {!box.ok ? (
        <PortProblem error={box.error} what="tu bandeja" className="border-y border-border" />
      ) : (
        <>
          <nav aria-label="Filtrar la bandeja" className="-mx-1 flex flex-wrap gap-2 pb-8">
            {FILTERS.map((f) => {
              const active = f.tipo === filtro;
              const count = f.tipo ? box.value.porTipo[f.tipo] : box.value.total;
              return (
                <Link
                  key={f.label}
                  href={route(f.tipo ? `/bandeja?tipo=${f.tipo}` : "/bandeja")}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "inline-flex h-11 items-center gap-2 rounded-full px-4 text-label font-medium transition-colors duration-150",
                    active ? "bg-fg text-bg" : "border border-border text-fg-muted hover:text-fg",
                  )}
                >
                  {f.label}
                  <span className="tabular">{count}</span>
                </Link>
              );
            })}
          </nav>

          {box.value.total === 0 ? (
            <div className="border-y border-border">
              <EmptyState
                icon={<PartyPopper aria-hidden="true" />}
                title="Estás al día"
                description="Cuando haya una entrega, un aviso o un pago, aparece aquí y en la campana."
              />
            </div>
          ) : (
            GROUPS.filter((g) => !filtro || g.tipo === filtro).map((g) => {
              const items = box.value.items.filter((i) => i.tipo === g.tipo);
              if (!filtro && items.length === 0) return null;
              return (
                <section key={g.tipo} aria-labelledby={`g-${g.tipo}`} className="reveal pb-10">
                  <div className="flex items-baseline justify-between gap-4">
                    <h2
                      id={`g-${g.tipo}`}
                      className="display text-[28px] font-medium md:text-[34px]"
                    >
                      {g.titulo} <span className="text-fg-muted tabular">{items.length}</span>
                    </h2>
                    {g.tipo === "aviso" && items.length > 0 && (
                      <form action={leerTodo}>
                        <button
                          type="submit"
                          className="inline-flex min-h-11 items-center text-label font-medium text-fg-muted underline-offset-4 hover:text-fg hover:underline"
                        >
                          Marcar todos como leídos
                        </button>
                      </form>
                    )}
                  </div>
                  {items.length === 0 ? (
                    <p className="mt-4 border-t border-border py-6 text-[15px] text-fg-muted">
                      {g.vacio}
                    </p>
                  ) : (
                    <ul className="mt-4 divide-y divide-border border-t border-border">
                      {items.map((i) => (
                        <Row key={i.id} item={i} now={now} />
                      ))}
                    </ul>
                  )}
                </section>
              );
            })
          )}
        </>
      )}
    </div>
  );
}

function Row({ item, now }: { item: InboxItem; now: Date }) {
  const when =
    item.tipo === "aviso" ? cap(timeAgo(new Date(item.fecha), now)) : dueLabel(item.fecha, now);
  return (
    <li className="flex items-center gap-2" data-testid="bandeja-item">
      <Link
        href={route(item.href)}
        className="-mx-2 flex min-h-16 min-w-0 flex-1 items-start gap-3 rounded-lg px-2 py-3.5 transition-colors duration-150 hover:bg-surface-subtle"
      >
        <InboxIcon kind={item.icono} className="mt-0.5 size-[18px] shrink-0 text-fg-muted" />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 font-semibold">
            {item.titulo}
            {item.urgente && (
              <span className="rounded-full bg-warning-soft px-2 py-0.5 text-caption font-semibold text-warning-fg">
                Urgente
              </span>
            )}
          </span>
          <span className="block text-label text-fg-muted">
            {item.slot && (
              <CourseDot slot={item.slot as CourseSlot} className="mr-1.5 align-middle" />
            )}
            {item.detalle}
          </span>
        </span>
        <span
          className={cx(
            "shrink-0 pt-0.5 text-label tabular",
            item.urgente ? "font-semibold" : "text-fg-muted",
          )}
        >
          {when}
        </span>
      </Link>
      {item.tipo === "aviso" && (
        <form action={leerAviso}>
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            aria-label={`Marcar como leído: ${item.titulo}`}
            className="grid size-11 place-items-center rounded-full text-fg-muted transition-colors duration-150 hover:bg-surface-subtle hover:text-fg active:scale-[0.96]"
          >
            <Check aria-hidden="true" className="size-[18px]" />
          </button>
        </form>
      )}
    </li>
  );
}
