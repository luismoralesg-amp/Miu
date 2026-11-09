import type { Metadata } from "next";
import Link from "next/link";
import { MessagesSquare } from "lucide-react";

import { EmptyState, PortProblem } from "@/design-system/components";
import { Composer } from "@/features/comunicacion/composer";
import { cap, route } from "@/features/shared/format";
import { academicNow, hhmm, relativeDay, timeAgo } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { withFault } from "@/lib/fault";
import { academic } from "@/modules/academic";
import { requireActor } from "@/modules/identity/session";
import { messaging } from "@/modules/messaging";

import { enviarMensaje } from "./actions";

export const metadata: Metadata = { title: "Mensajes" };

type Props = { searchParams: Promise<{ con?: string }> };

/** Conversations with the teachers and assistants of your courses, inside MiU. */
export default async function ComunicacionPage({ searchParams }: Props) {
  const actor = await requireActor();
  const con = (await searchParams).con;
  const now = academicNow();
  // Open the thread first: opening marks it read, so the list below already reflects it.
  const thread = con ? await messaging().getThread(actor, con) : null;
  const [threads, people] = await Promise.all([
    withFault("messaging", () => messaging().listThreads(actor)),
    academic().listCoursePeople(actor),
  ]);
  const known = new Set(threads.ok ? threads.value.map((t) => t.personaId) : []);
  const nuevos = people.ok ? people.value.filter((p) => !known.has(p.id)) : [];

  // `grid-cols-1` below is `minmax(0, 1fr)`. With no track under `md` the one implicit column grew to the
  // widest nowrap preview (624 px on a 375 px screen), the page overflowed sideways and a phone browser
  // shrank it to fit, which looked like the desktop layout.
  return (
    <div className="pb-10">
      <section className="reveal pt-10 pb-8 md:pt-14 md:pb-10">
        <p className="text-[15px] text-fg-muted">Con catedráticos y auxiliares de tus cursos</p>
        <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium md:text-[64px]">
          Mensajes
        </h1>
      </section>
      {!threads.ok ? (
        <PortProblem error={threads.error} what="tus mensajes" className="border-y border-border" />
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <nav
            aria-label="Conversaciones"
            className={cx("min-w-0 md:col-span-4", con && "hidden md:block")}
          >
            <ul className="divide-y divide-border border-y border-border">
              {threads.value.map((t) => (
                <li key={t.personaId}>
                  <Link
                    href={route(`/comunicacion?con=${t.personaId}`)}
                    aria-current={t.personaId === con ? "page" : undefined}
                    className={cx(
                      "-mx-2 flex flex-col gap-0.5 rounded-lg px-2 py-3.5 transition-colors duration-150 hover:bg-surface-subtle",
                      t.personaId === con && "bg-surface",
                    )}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span
                        className={cx(
                          "font-semibold",
                          t.noLeidos > 0 &&
                            "after:ml-2 after:inline-block after:size-2 after:rounded-full after:bg-info-fg",
                        )}
                      >
                        {t.nombre}
                      </span>
                      <span className="shrink-0 text-caption text-fg-muted">
                        {cap(timeAgo(new Date(t.fecha), now))}
                      </span>
                    </span>
                    <span className="truncate text-label text-fg-muted">{t.ultimo}</span>
                    {t.noLeidos > 0 && <span className="sr-only">Sin leer</span>}
                  </Link>
                </li>
              ))}
            </ul>
            {nuevos.length > 0 && (
              <>
                <h2 className="pt-6 pb-2 text-label text-fg-muted">Escribir a</h2>
                <ul className="flex flex-col">
                  {nuevos.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={route(`/comunicacion?con=${p.id}`)}
                        className="-mx-2 flex min-h-11 items-center justify-between rounded-lg px-2 text-[15px] hover:bg-surface-subtle"
                      >
                        {p.nombre}
                        <span className="text-caption text-fg-muted">{p.rol}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </nav>
          <section aria-label="Conversación" className="min-w-0 md:col-span-8">
            {!thread ? (
              <EmptyState
                icon={<MessagesSquare aria-hidden="true" />}
                title="Elige una conversación"
                description="O escribe a alguien de tus cursos desde la lista."
              />
            ) : !thread.ok ? (
              <PortProblem error={thread.error} what="la conversación" />
            ) : (
              <div className="flex flex-col gap-4">
                <Link
                  href="/comunicacion"
                  className="text-label text-fg-muted underline underline-offset-4 md:hidden"
                >
                  Todas las conversaciones
                </Link>
                <h2 className="display text-[28px] font-medium">
                  {thread.value.persona.nombre}{" "}
                  <span className="text-[18px] text-fg-muted">· {thread.value.persona.rol}</span>
                </h2>
                <ol
                  className="flex flex-col gap-3"
                  aria-label={`Mensajes con ${thread.value.persona.nombre}`}
                >
                  {thread.value.mensajes.length === 0 && (
                    <li className="text-[15px] text-fg-muted">
                      Aún no se han escrito. Empieza la conversación.
                    </li>
                  )}
                  {thread.value.mensajes.map((m) => (
                    <li
                      key={m.id}
                      className={cx(
                        "max-w-[80%] rounded-2xl px-4 py-3",
                        m.de === "yo"
                          ? "self-end bg-surface-subtle"
                          : "self-start border border-border bg-surface",
                      )}
                    >
                      <p className="text-[15px] break-words whitespace-pre-wrap">{m.texto}</p>
                      <p className="mt-1 text-caption text-fg-muted">
                        {m.de === "yo" ? "Tú" : thread.value.persona.nombre.split(" ")[0]} ·{" "}
                        {relativeDay(new Date(m.fecha), now)} {hhmm(new Date(m.fecha))}
                      </p>
                    </li>
                  ))}
                </ol>
                <Composer
                  action={enviarMensaje.bind(null, thread.value.persona.id)}
                  para={thread.value.persona.nombre}
                />
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
