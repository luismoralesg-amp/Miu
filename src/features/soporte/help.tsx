"use client";

import Link from "next/link";
import { MessageCircle, Search } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/design-system/components";
import type { ChatSession, Department, Faq } from "@/modules/support";
import { abrirChat, escribirSoporte } from "@/app/(app)/soporte/actions";

import { route } from "../shared/format";

const DEPTS: Array<[Department, string]> = [
  ["registro", "Registro académico"],
  ["finanzas", "Finanzas estudiantiles"],
  ["tecnologia", "Tecnología"],
];
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** FAQ first (most answers are already written), then a chat that already knows who you are and where you were. */
export function Help({ faq, desde }: { faq: Faq[]; desde: string }) {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<Department>("tecnologia");
  const [session, setSession] = useState<ChatSession | null>(null);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  /** The screen of origin: the explicit ?desde=, or the previous page of MiU when there is one. */
  const origin = () => {
    if (desde) return desde;
    try {
      const ref = new URL(document.referrer);
      return ref.origin === window.location.origin && ref.pathname !== "/soporte"
        ? ref.pathname
        : "";
    } catch {
      return "";
    }
  };
  const shown = faq.filter((f) =>
    fold(`${f.pregunta} ${f.respuesta} ${f.tema}`).includes(fold(q.trim())),
  );

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <section aria-labelledby="faq-t" className="lg:col-span-7">
        <h2 id="faq-t" className="pb-3 display text-[28px] font-medium">
          Preguntas frecuentes
        </h2>
        <label className="relative mb-4 block max-w-md">
          <span className="sr-only">Buscar en las preguntas</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-fg-muted"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pagos, entregas, acceso…"
            className="h-12 w-full rounded-full border border-border-control bg-surface pr-4 pl-11"
          />
        </label>
        {shown.length === 0 ? (
          <p className="border-y border-border py-6 text-[15px] text-fg-muted">
            Ninguna pregunta coincide. Escríbenos por el chat.
          </p>
        ) : (
          <div className="divide-y divide-border border-y border-border">
            {shown.map((f) => (
              <details key={f.id} className="group py-1">
                <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-4 font-semibold">
                  {f.pregunta}
                  <span className="shrink-0 text-caption font-normal text-fg-muted">{f.tema}</span>
                </summary>
                <p className="pb-4 text-[15px]">
                  {f.respuesta}{" "}
                  {f.href && (
                    <Link href={route(f.href)} className="underline underline-offset-4">
                      Ir
                    </Link>
                  )}
                </p>
              </details>
            ))}
          </div>
        )}
      </section>
      <section aria-labelledby="chat-t" className="flex flex-col gap-4 lg:col-span-5">
        <h2 id="chat-t" className="display text-[28px] font-medium">
          Hablar con Soporte
        </h2>
        {!session ? (
          <div className="flex flex-col gap-4 rounded-[20px] border border-border bg-surface p-6">
            <label className="flex flex-col gap-1.5 text-label font-medium">
              ¿Con quién?
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value as Department)}
                className="h-11 rounded-md border border-border-control bg-bg px-3 font-normal"
              >
                {DEPTS.map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-label text-fg-muted">
              Abrimos el chat con tu nombre, tu carné y la pantalla de la que vienes
              {desde ? ` (${desde})` : ""}, para que no tengas que explicarlo.
            </p>
            <Button
              variant="ink"
              pill
              icon={<MessageCircle aria-hidden="true" />}
              loading={pending}
              onClick={() =>
                start(async () => {
                  const r = await abrirChat(dept, origin());
                  if ("error" in r && r.error) setError(r.error);
                  else if ("session" in r && r.session) setSession(r.session);
                })
              }
            >
              Abrir el chat
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-[20px] border border-border bg-surface p-5">
            <p className="text-caption text-fg-muted">
              Soporte ve: {session.contexto.nombre} · carné {session.contexto.carne} ·{" "}
              {session.contexto.rol} · desde {session.contexto.pantalla}
            </p>
            <ol className="flex flex-col gap-2" aria-label="Chat con Soporte" aria-live="polite">
              {session.mensajes.map((m, i) => (
                <li
                  key={i}
                  className={
                    m.de === "yo"
                      ? "self-end rounded-2xl bg-surface-subtle px-3 py-2 text-[15px]"
                      : "self-start rounded-2xl border border-border px-3 py-2 text-[15px]"
                  }
                >
                  {m.texto}
                </li>
              ))}
            </ol>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                start(async () => {
                  const r = await escribirSoporte(session.id, texto);
                  if ("error" in r && r.error) setError(r.error);
                  else if ("session" in r && r.session) {
                    setSession(r.session);
                    setTexto("");
                  }
                });
              }}
            >
              <label htmlFor="msg-soporte" className="sr-only">
                Mensaje para Soporte
              </label>
              <input
                id="msg-soporte"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                className="h-11 flex-1 rounded-md border border-border-control bg-bg px-3"
              />
              <Button type="submit" variant="ink" loading={pending}>
                Enviar
              </Button>
            </form>
          </div>
        )}
        {error && (
          <p role="alert" className="text-label text-danger-fg">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
