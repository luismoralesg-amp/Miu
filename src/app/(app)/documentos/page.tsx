import type { Metadata } from "next";
import { CircleAlert, CircleCheck, Download, FileBadge } from "lucide-react";

import { EmptyState, PortProblem } from "@/design-system/components";
import { requirePermission } from "@/authz/server";
import { cap, shortDate } from "@/features/shared/format";
import { academicNow, longDate } from "@/lib/clock";
import { withFault } from "@/lib/fault";
import { academic } from "@/modules/academic";
import { documents, documentKinds, kindLabel } from "@/modules/documents";
import { requireActor } from "@/modules/identity/session";

import { solicitarDocumento } from "./actions";

export const metadata: Metadata = { title: "Documentos académicos" };

type Props = {
  searchParams: Promise<{
    desde?: string;
    hasta?: string;
    q?: string;
    solicitado?: string;
    error?: string;
  }>;
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Official documents: the current term by default, one search, and a request in one step. */
export default async function DocumentosPage({ searchParams }: Props) {
  await requirePermission("view_academic_record");
  const actor = await requireActor();
  const sp = await searchParams;
  const hoy = new Date(academicNow().getTime() - 6 * 36e5).toISOString().slice(0, 10);
  const term = await academic().getTerm();
  const desde = sp.desde && ISO.test(sp.desde) ? sp.desde : term.ok ? term.value.inicio : hoy;
  const hasta = sp.hasta && ISO.test(sp.hasta) ? (sp.hasta > hoy ? hoy : sp.hasta) : hoy;
  const q = (sp.q ?? "").slice(0, 80);
  const list = await withFault("documents", () =>
    documents().listAcademicDocuments(actor, { desde, hasta, q }),
  );
  const input = "h-11 rounded-md border border-border-control bg-surface px-3 font-normal tabular";
  return (
    <div className="pb-10">
      <section className="reveal pt-10 pb-8 md:pt-14 md:pb-10">
        <p className="text-[15px] text-fg-muted">Constancias, certificaciones y cartas</p>
        <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium md:text-[64px]">
          Documentos
        </h1>
      </section>
      {sp.solicitado === "1" && (
        <p
          role="status"
          className="mb-6 flex items-center gap-2 rounded-lg bg-success-soft px-4 py-3 text-[15px] text-success-fg"
        >
          <CircleCheck aria-hidden="true" className="size-5" />
          Solicitud recibida. Aparece abajo como “en proceso” y te avisamos cuando esté lista.
        </p>
      )}
      {sp.error && (
        <p
          role="alert"
          className="mb-6 flex items-center gap-2 rounded-lg bg-danger-soft px-4 py-3 text-[15px] text-danger-fg"
        >
          <CircleAlert aria-hidden="true" className="size-5" />
          No se pudo registrar la solicitud. Inténtalo de nuevo.
        </p>
      )}
      <form
        action={solicitarDocumento}
        className="mb-8 flex flex-wrap items-end gap-3 rounded-[16px] border border-border bg-surface p-5"
      >
        <label className="flex flex-col gap-1.5 text-label font-medium">
          Solicitar un documento
          <select name="tipo" className={input}>
            {documentKinds.map((k) => (
              <option key={k} value={k}>
                {kindLabel[k]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="inline-flex h-11 items-center rounded-full bg-fg px-5 text-label font-semibold text-bg"
        >
          Solicitar
        </button>
        <p className="w-full text-caption text-fg-muted">
          Sin costo en la demo; el arancel y el plazo reales los define la UFM.
        </p>
      </form>
      <form method="get" className="flex flex-wrap items-end gap-3 border-y border-border py-5">
        <label className="flex flex-col gap-1.5 text-label font-medium">
          Buscar
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Tipo, título o código"
            className={`${input} w-64`}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-label font-medium">
          Desde
          <input type="date" name="desde" defaultValue={desde} max={hoy} className={input} />
        </label>
        <label className="flex flex-col gap-1.5 text-label font-medium">
          Hasta
          <input type="date" name="hasta" defaultValue={hasta} max={hoy} className={input} />
        </label>
        <button
          type="submit"
          className="inline-flex h-11 items-center rounded-full border border-border-strong px-5 text-label font-semibold"
        >
          Ver
        </button>
        <p className="w-full text-caption text-fg-muted sm:w-auto sm:pb-3">
          Por defecto: el semestre hasta hoy.
        </p>
      </form>
      {!list.ok ? (
        <PortProblem error={list.error} what="tus documentos" />
      ) : list.value.length === 0 ? (
        <EmptyState
          icon={<FileBadge aria-hidden="true" />}
          title="No hay documentos en este rango"
          description="Amplía las fechas o solicita uno nuevo arriba."
        />
      ) : (
        <ul className="divide-y divide-border" aria-label="Tus documentos">
          {list.value.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-4 py-4"
              aria-label={d.titulo}
            >
              <span className="min-w-0">
                <span className="block font-semibold">{d.titulo}</span>
                <span className="text-label text-fg-muted tabular">
                  {cap(longDate(new Date(d.fecha)))} · código de verificación {d.verificacion}
                </span>
              </span>
              {d.estado === "listo" ? (
                <a
                  href={`/api/documentos/${d.id}`}
                  download
                  aria-label={`Descargar ${d.titulo}`}
                  className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-surface-subtle"
                >
                  <Download aria-hidden="true" className="size-[18px]" />
                </a>
              ) : (
                <span className="shrink-0 rounded-full bg-warning-soft px-2 py-0.5 text-caption font-semibold text-warning-fg">
                  En proceso · {shortDate(d.fecha)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
