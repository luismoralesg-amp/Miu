import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarPlus, CircleCheck } from "lucide-react";

import { PortProblem } from "@/design-system/components";
import { CopyButton } from "@/features/actividad/copy-button";
import { SubmitForm } from "@/features/actividad/submit-form";
import { loadCourse } from "@/features/curso/load";
import { cap, route } from "@/features/shared/format";
import { academicNow, daysBetween, hhmm, longDate } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { withFault } from "@/lib/fault";
import { assessment, type StudentActivity } from "@/modules/assessment";

import { entregar } from "./actions";

type Props = { params: Promise<{ cursoId: string; actividadId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { actividadId } = await params;
  return { title: actividadId.replace(/-/g, " ") };
}

const KIND: Record<StudentActivity["tipo"], string> = {
  tarea: "Tarea",
  examen: "Examen",
  quiz: "Quiz",
  proyecto: "Proyecto",
  lectura: "Lectura",
};

function left(fecha: string, now: Date) {
  const min = Math.round((Date.parse(fecha) - now.getTime()) / 6e4);
  if (min <= 0) return "ya cerró";
  if (min < 60) return `faltan ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 48) return `faltan ${h} h ${min % 60} min`;
  return `faltan ${Math.floor(h / 24)} días`;
}

/** An activity: the rubric is visible before handing in; the receipt stays on the page after. */
export default async function ActivityPage({ params }: Props) {
  const { cursoId, actividadId } = await params;
  const { actor, course } = await loadCourse(cursoId);
  if (!course.ok) return null;
  const result = await withFault("assessment", () => assessment().getActivity(actor, actividadId));
  if (!result.ok && result.error === "not_found") notFound();
  if (!result.ok) return <PortProblem error={result.error} what="la actividad" />;
  const a = result.value;
  if (a.curso.id !== cursoId) notFound();
  const now = academicNow();
  const d = new Date(a.fecha);
  const abierta =
    a.estado === "pendiente" || (a.estado === "entregada" && Date.parse(a.fecha) > now.getTime());
  const enMiu = a.modo === "archivo" || a.modo === "texto" || a.modo === "repositorio";

  return (
    <article aria-labelledby="act-t">
      <Link
        href={route(`/cursos/${cursoId}/actividades`)}
        className="inline-flex min-h-11 items-center gap-1.5 text-label font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Actividades
      </Link>
      <header className="pt-2 pb-8">
        <p className="text-[15px] text-fg-muted">
          {KIND[a.tipo]} · vale {a.peso}%
        </p>
        <h2
          id="act-t"
          className="mt-1 display text-[32px] leading-tight font-medium md:text-[44px]"
        >
          {a.titulo}
        </h2>
        <p className="mt-2 text-[15px]">
          <span className="font-semibold">
            {cap(longDate(d))}, {hhmm(d)}
          </span>{" "}
          <span className="text-fg-muted">
            · {daysBetween(now, d) >= 0 ? left(a.fecha, now) : "cerró"}
            {a.salon ? ` · ${a.salon}` : ""}
          </span>
        </p>
      </header>

      <div className="grid gap-10 border-t border-border pt-8 md:grid-cols-12">
        <div className="flex flex-col gap-8 md:col-span-7">
          {a.descripcion && <p className="max-w-[65ch] text-body">{a.descripcion}</p>}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-[15px]">
            <div>
              <dt className="text-label text-fg-muted">Formato</dt>
              <dd className="mt-0.5">{a.formato}</dd>
            </div>
            <div>
              <dt className="text-label text-fg-muted">Entrega atrasada</dt>
              <dd className="mt-0.5">
                {a.atrasadaPermitida ? "Se permite, marcada como atrasada" : "No se permite"}
              </dd>
            </div>
            {a.temas && (
              <div className="col-span-2">
                <dt className="text-label text-fg-muted">Temas</dt>
                <dd className="mt-0.5">{cap(a.temas)}</dd>
              </div>
            )}
          </dl>
          <section aria-labelledby="rub-t">
            <h3 id="rub-t" className="text-label text-fg-muted">
              Rúbrica
            </h3>
            <table className="mt-2 w-full max-w-md text-[15px]">
              <caption className="sr-only">Criterios de evaluación y su peso</caption>
              <tbody className="divide-y divide-border border-y border-border">
                {a.rubrica.map((r) => (
                  <tr key={r.criterio}>
                    <th scope="row" className="py-2.5 text-left font-normal">
                      {r.criterio}
                    </th>
                    <td className="py-2.5 text-right font-semibold tabular">{r.peso}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <a
            href={`/api/ics/actividad/${a.id}`}
            download
            className="inline-flex min-h-11 w-fit items-center gap-2 text-label font-medium underline underline-offset-4"
          >
            <CalendarPlus aria-hidden="true" className="size-4" />
            Agregar a mi calendario (.ics)
          </a>
        </div>

        <aside
          aria-label="Entrega"
          className={cx(
            "flex flex-col gap-6 md:col-span-5",
            // On a phone the receipt or the grade is the point of coming back: show it first.
            (a.entrega || a.calificacion) && "order-first md:order-none",
          )}
        >
          {a.calificacion && (
            <section
              aria-labelledby="nota-t"
              className="rounded-[20px] border border-border bg-surface p-6"
            >
              <h3 id="nota-t" className="text-label text-fg-muted">
                Tu nota
              </h3>
              <p className="mt-1 display text-[56px] leading-none tabular">{a.calificacion.nota}</p>
              <p className="mt-2 text-label text-fg-muted">
                {a.calificacion.por.nombre}
                {a.calificacion.por.rol && `, ${a.calificacion.por.rol.toLowerCase()}`} ·{" "}
                {cap(longDate(new Date(a.calificacion.fecha)))}
              </p>
              {a.calificacion.comentario && (
                <p className="mt-4 text-body">“{a.calificacion.comentario}”</p>
              )}
            </section>
          )}
          {a.entrega && (
            <section
              aria-labelledby="recibo-t"
              className="rounded-[20px] border border-border bg-surface p-6"
              data-testid="recibo"
            >
              <h3 id="recibo-t" className="flex items-center gap-2 font-semibold">
                <CircleCheck aria-hidden="true" className="size-5 text-success-fg" />
                Entregado{a.entrega.atrasada ? " con atraso" : ""}
              </h3>
              <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-label">
                <dt className="text-fg-muted">Recibo</dt>
                <dd className="font-semibold tabular">{a.entrega.recibo}</dd>
                <dt className="text-fg-muted">Hora</dt>
                <dd className="tabular">
                  {cap(longDate(new Date(a.entrega.fecha)))}, {hhmm(new Date(a.entrega.fecha))}
                </dd>
                <dt className="text-fg-muted">Archivo</dt>
                <dd className="break-all">{a.entrega.archivo}</dd>
                <dt className="text-fg-muted">Huella</dt>
                <dd className="font-mono text-caption break-all" title="SHA-256 del archivo">
                  {a.entrega.hash}
                </dd>
              </dl>
              <CopyButton value={a.entrega.hash} label="Copiar la huella" />
            </section>
          )}
          {enMiu && abierta ? (
            <section aria-labelledby="entrega-t" className="flex flex-col gap-3">
              <h3 id="entrega-t" className="font-semibold">
                {a.entrega ? "¿Quieres cambiar tu entrega?" : "Tu entrega"}
              </h3>
              <SubmitForm
                action={entregar.bind(null, a.id)}
                modo={a.modo}
                formato={a.formato}
                reemplazo={Boolean(a.entrega)}
              />
            </section>
          ) : !a.entrega && !a.calificacion ? (
            <p className="rounded-[20px] border border-border p-6 text-[15px] text-fg-muted">
              {a.modo === "presencial"
                ? `Es presencial${a.salon ? ` en ${a.salon}` : ""}. Lleva tu carné.`
                : a.modo === "en_linea"
                  ? `${a.formato}. Se responde en línea; el enlace se habilita a la hora de inicio.`
                  : "La fecha límite ya pasó y esta actividad no acepta entregas atrasadas."}
            </p>
          ) : null}
        </aside>
      </div>
    </article>
  );
}
