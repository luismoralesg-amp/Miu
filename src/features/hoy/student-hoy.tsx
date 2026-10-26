import Link from "next/link";
import { BadgeCheck, Check } from "lucide-react";

import { CourseDot, PortProblem } from "@/design-system/components";
import type { CourseSlot } from "@/design-system/components";
import { academicNow, daysBetween, hhmm, weekdayName } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { withFault } from "@/lib/fault";
import { academic } from "@/modules/academic";
import { assessment } from "@/modules/assessment";
import { ledger } from "@/modules/finance";
import type { Actor } from "@/modules/identity";
import { inbox } from "@/modules/inbox";

import { cap, plural, route } from "../shared/format";
import {
  AllDone,
  CalmHero,
  DayTimeline,
  Hero,
  NewsRow,
  PaymentNotice,
  PendingRow,
  SectionTitle,
  SideLink,
} from "./sections";
import { buildToday, duration } from "./today";

/** Hoy for a student: one focus (the hero), the day on a real time axis, then work and news. */
export async function StudentHoy({ actor }: { actor: Actor }) {
  const now = academicNow();
  const [term, schedule, activities, box, balance] = await Promise.all([
    withFault("academic", () => academic().getTerm()),
    withFault("academic", () => academic().getSchedule(actor)),
    withFault("assessment", () => assessment().listActivities(actor)),
    withFault("inbox", () => inbox().listItems(actor)),
    withFault("ledger", () => ledger().getBalance(actor)),
  ]);
  if (!term.ok) return <PortProblem error={term.error} what="tu día" className="py-24" />;

  const today = buildToday({
    now,
    term: term.value,
    schedule: schedule.ok ? schedule.value : [],
    activities: activities.ok ? activities.value : [],
    avisos: box.ok ? box.value.items.filter((i) => i.tipo === "aviso") : [],
    balance: balance.ok ? balance.value : null,
  });
  const nombre = actor.nombre.split(" ")[0];

  return (
    <>
      <section
        className="flex reveal flex-col gap-4 pt-10 pb-8 md:flex-row md:items-end md:justify-between md:pt-14 md:pb-10"
        style={{ "--i": 0 } as React.CSSProperties}
      >
        <div>
          <p className="text-[15px] text-fg-muted">
            {today.fecha} · semana {today.semana.actual} de {today.semana.total}
            {today.variante === "examenes" && (
              <span className="font-semibold text-fg"> · semana de exámenes</span>
            )}
          </p>
          <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium text-balance md:text-[64px]">
            {today.variante === "examenes" && today.examenes
              ? `${cap(spellCount(today.examenes.lista.length))} ${today.examenes.lista.length === 1 ? "examen" : "exámenes"} en ${today.examenes.libres.length || 1} ${today.examenes.libres.length === 1 ? "día" : "días"}`
              : `${today.saludo}, ${nombre}`}
          </h1>
        </div>
        {today.aviso && today.variante !== "noche" && <PaymentNotice aviso={today.aviso} />}
      </section>

      <div className="flex flex-col">
        <div className="reveal" style={{ "--i": 1 } as React.CSSProperties}>
          {!activities.ok ? (
            <div className="rounded-[20px] border border-border">
              <PortProblem error={activities.error} what="tus entregas y exámenes" />
            </div>
          ) : today.hero ? (
            <Hero
              {...today.hero}
              now={now}
              {...(today.variante === "noche" ? { accion: "Repasar esta noche" } : {})}
            />
          ) : (
            <CalmHero siguiente={today.siguiente} now={now} />
          )}
        </div>

        {today.variante === "dia" && (
          <section
            aria-labelledby="dia-t"
            className="reveal border-b border-border py-10 md:py-12"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            <SectionTitle
              id="dia-t"
              action={
                <SideLink href="/semana">
                  <span>
                    Semana<span className="hidden sm:inline"> completa</span>
                  </span>
                </SideLink>
              }
            >
              Tu día
            </SectionTitle>
            {schedule.ok ? (
              <>
                <p className="mt-1 text-[15px] text-fg-muted">
                  {plural(today.dia.clases.length, "clase", "clases")}
                  {today.dia.libre > 0 && ` · ${duration(today.dia.libre)} libres entre clases`}
                </p>
                <DayTimeline dia={today.dia} now={now} />
              </>
            ) : (
              <PortProblem error={schedule.error} what="tu horario" />
            )}
          </section>
        )}

        {today.variante === "noche" && <NightBlock today={today} />}
        {today.variante === "examenes" && today.examenes && <ExamBlock today={today} now={now} />}

        <div className="grid md:grid-cols-12 md:divide-x md:divide-border">
          <section
            aria-labelledby="pe-t"
            className={cx(
              "reveal border-b border-border py-10 md:border-b-0",
              today.variante === "noche" ? "md:col-span-12" : "md:col-span-7 md:pr-12",
            )}
            style={{ "--i": 3 } as React.CSSProperties}
          >
            <SectionTitle
              id="pe-t"
              action={
                today.totalPendientes > 0 && (
                  <SideLink href="/bandeja?tipo=pendiente">
                    Ver las {today.totalPendientes}
                  </SideLink>
                )
              }
            >
              Por entregar
            </SectionTitle>
            {!activities.ok ? (
              <PortProblem error={activities.error} what="tus entregas" />
            ) : today.porEntregar.length === 0 ? (
              <AllDone
                title="Nada por entregar"
                description="No tienes entregas abiertas en las próximas dos semanas."
              />
            ) : (
              <ul className="mt-4 divide-y divide-border border-t border-border">
                {today.porEntregar.slice(0, today.variante === "noche" ? 3 : 4).map((a) => (
                  <PendingRow key={a.id} a={a} now={now} />
                ))}
              </ul>
            )}
          </section>
          {today.variante !== "noche" && (
            <section
              aria-labelledby="no-t"
              className="reveal py-10 md:col-span-5 md:pl-12"
              style={{ "--i": 4 } as React.CSSProperties}
            >
              <SectionTitle
                id="no-t"
                action={
                  today.nuevas > 0 && (
                    <SideLink href="/bandeja?tipo=aviso">
                      {plural(today.nuevas, "nueva", "nuevas")}
                    </SideLink>
                  )
                }
              >
                Novedades
              </SectionTitle>
              {!box.ok ? (
                <PortProblem error={box.error} what="tus novedades" />
              ) : today.novedades.length === 0 ? (
                <AllDone
                  title="Estás al día"
                  description="Cuando publiquen una nota, un anuncio o un documento, aparece aquí."
                />
              ) : (
                <ul className="mt-4 divide-y divide-border border-t border-border">
                  {today.novedades.map((n) => (
                    <NewsRow key={n.id} n={n} now={now} />
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  );
}

const WORDS = ["Cero", "Un", "Dos", "Tres", "Cuatro", "Cinco", "Seis", "Siete", "Ocho", "Nueve"];
const spellCount = (n: number) => WORDS[n] ?? String(n);

type T = ReturnType<typeof buildToday>;

function NightBlock({ today }: { today: T }) {
  const hechas = today.noche.entregadasHoy;
  return (
    <div className="mt-10 grid border-y border-border md:grid-cols-12 md:divide-x md:divide-border">
      <section aria-labelledby="hecho-t" className="reveal py-10 md:col-span-5 md:pr-12">
        <SectionTitle id="hecho-t">Lo que hiciste hoy</SectionTitle>
        <ul className="mt-5 flex flex-col gap-4 text-[15px]">
          <li className="flex gap-3">
            <Check aria-hidden="true" className="mt-0.5 size-[18px] shrink-0" />
            <span>
              {plural(today.noche.clasesHoy.length, "clase", "clases")}
              {today.noche.clasesHoy.length > 0 &&
                `: ${today.noche.clasesHoy.map((c) => c.corto).join(", ")}`}
            </span>
          </li>
          {hechas.map((a) => (
            <li key={a.id} className="flex gap-3">
              <Check aria-hidden="true" className="mt-0.5 size-[18px] shrink-0" />
              <span>
                Entregaste <b className="font-semibold">{a.titulo}</b> de {a.curso.corto} a las{" "}
                {hhmm(new Date(a.entrega!.fecha))}
              </span>
            </li>
          ))}
          <li className="flex gap-3">
            <BadgeCheck aria-hidden="true" className="mt-0.5 size-[18px] shrink-0" />
            <span>
              {plural(today.nuevas, "novedad sin abrir", "novedades sin abrir")} ·{" "}
              <Link href="/bandeja?tipo=aviso" className="underline underline-offset-4">
                verlas
              </Link>
            </span>
          </li>
        </ul>
      </section>
      <section
        aria-labelledby="man-t"
        className="reveal border-t border-border py-10 md:col-span-7 md:border-t-0 md:pl-12"
      >
        <SectionTitle
          id="man-t"
          action={<p className="text-label text-fg-muted">{cap(today.noche.fechaManana)}</p>}
        >
          Mañana
        </SectionTitle>
        {today.noche.manana.length === 0 ? (
          <p className="mt-5 text-[15px] text-fg-muted">Mañana no tienes clases ni entregas.</p>
        ) : (
          <ol className="mt-5 divide-y divide-border border-t border-border">
            {today.noche.manana.map((m) => (
              <li key={`${m.hora}-${m.titulo}`}>
                <Link href={route(m.href)} className="flex min-h-14 items-center gap-4 py-3">
                  <span
                    className={cx(
                      "w-14 text-[15px] tabular",
                      m.examen ? "font-semibold" : "text-fg-muted",
                    )}
                  >
                    {m.hora}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-semibold">
                      <CourseDot slot={m.slot as CourseSlot} />
                      {m.titulo}
                    </span>
                    <span className="text-label text-fg-muted">{m.lugar}</span>
                  </span>
                  {m.examen && (
                    <span className="rounded-full border border-fg px-2 py-0.5 text-caption font-semibold">
                      Examen
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

const COLS: Record<number, string> = { 1: "", 2: "", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" };

function ExamBlock({ today, now }: { today: T; now: Date }) {
  const { lista, libres } = today.examenes!;
  const max = Math.max(1, ...libres.map((l) => l.minutos));
  return (
    <>
      <section aria-labelledby="cal-t" className="reveal border-b border-border py-10 md:py-12">
        <SectionTitle id="cal-t">Calendario de exámenes</SectionTitle>
        <ol
          className={cx(
            "mt-6 grid gap-px overflow-hidden rounded-[16px] border border-border bg-border",
            lista.length > 1 && "sm:grid-cols-2",
            COLS[Math.min(lista.length, 4)],
          )}
        >
          {lista.map((x) => {
            const d = new Date(x.fecha);
            const dias = daysBetween(now, d);
            return (
              <li key={x.id} className="bg-surface">
                <Link
                  href={route(`/cursos/${x.curso.id}/actividades/${x.id}`)}
                  className="flex h-full flex-col gap-3 p-6 transition-colors duration-150 hover:bg-surface-subtle"
                >
                  <span className="flex items-center justify-between text-label text-fg-muted">
                    <span className="font-semibold text-fg">
                      {cap(weekdayName(d))} {new Date(d.getTime() - 6 * 36e5).getUTCDate()}
                    </span>
                    <span>{dias === 0 ? "hoy" : dias === 1 ? "mañana" : `en ${dias} días`}</span>
                  </span>
                  <span className="display text-[24px] leading-tight font-medium">
                    {x.curso.nombre}
                  </span>
                  <span className="flex items-center gap-2 text-label text-fg-muted">
                    <CourseDot slot={x.curso.slot as CourseSlot} />
                    {x.titulo} · {hhmm(d)} · {x.salon?.split(" ")[0]}
                  </span>
                  <span className="text-label">
                    <span className="font-semibold tabular">{x.peso}%</span>{" "}
                    <span className="text-fg-muted">
                      de la nota{x.temas ? ` · ${x.temas}` : ""}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
      <section aria-labelledby="lib-t" className="reveal border-b border-border py-10 md:py-12">
        <SectionTitle
          id="lib-t"
          action={<p className="text-label text-fg-muted">Entre 07:00 y 21:00</p>}
        >
          Horas libres para estudiar
        </SectionTitle>
        <ol className="mt-6 flex flex-col">
          {libres.map((l, i) => {
            const d = new Date(l.fecha);
            return (
              <li
                key={l.fecha}
                className="grid grid-cols-[6rem_1fr_auto] items-center gap-4 border-b border-border py-3 md:grid-cols-[9rem_1fr_6rem]"
              >
                <span className="flex flex-col">
                  <span className={cx("text-[15px]", i === 0 && "font-semibold")}>
                    {i === 0 ? "Hoy" : cap(weekdayName(d))}{" "}
                    {new Date(d.getTime() - 6 * 36e5).getUTCDate()}
                  </span>
                  {l.examen && (
                    <span className="flex items-center gap-1.5 text-caption whitespace-nowrap text-fg-muted sm:hidden">
                      <CourseDot slot={l.examen.curso.slot as CourseSlot} />
                      {l.examen.titulo}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="h-2 rounded-full bg-fg"
                    style={{ width: `${(l.minutos / max) * 100}%` }}
                  />
                  {l.examen && (
                    <span className="hidden shrink-0 items-center gap-1.5 text-caption text-fg-muted sm:flex">
                      <CourseDot slot={l.examen.curso.slot as CourseSlot} />
                      {l.examen.titulo}
                    </span>
                  )}
                </span>
                <span className="text-right text-[15px] font-semibold whitespace-nowrap tabular">
                  {duration(l.minutos)}
                </span>
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}
