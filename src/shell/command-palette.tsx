"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { ArrowUpRight, Search } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { CourseDot, Kbd } from "@/design-system/components";
import { cx } from "@/lib/cx";

import type { CommandItem } from "./data";
import { Icon } from "./icons";

const GROUP_ORDER: CommandItem["grupo"][] = [
  "Acciones",
  "Cursos",
  "Actividades",
  "Secciones",
  "Personas",
];

const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Every word of the query must appear; titles that start with the query rank first. */
export function filterCommands(items: CommandItem[], query: string): CommandItem[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return GROUP_ORDER.flatMap((g) =>
      items.filter((i) => i.grupo === g).slice(0, g === "Acciones" ? 6 : 3),
    );
  }
  const q = normalize(query.trim());
  return GROUP_ORDER.flatMap((g) =>
    items
      .filter((i) => i.grupo === g)
      .filter((i) => {
        const hay = normalize(`${i.titulo} ${i.detalle} ${i.palabras ?? ""} ${i.grupo}`);
        return words.every((w) => hay.includes(w));
      })
      .sort(
        (a, b) =>
          Number(normalize(b.titulo).startsWith(q)) - Number(normalize(a.titulo).startsWith(q)),
      )
      .slice(0, 8),
  );
}

/**
 * ⌘K runs actions, not just search. Native <dialog> traps focus and returns it on close; the input is
 * an ARIA combobox driving a grouped listbox through aria-activedescendant.
 * No open animation: it is a keyboard shortcut used many times a day (emil-design-eng).
 */
export function CommandPalette({
  items,
  open,
  onOpenChange,
}: {
  items: CommandItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const uid = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const results = useMemo(() => filterCommands(items, query), [items, query]);
  const optionId = (i: number) => `${uid}-op-${i}`;

  // Global shortcut: ⌘K on macOS, Ctrl+K elsewhere.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      setQuery("");
      setActive(0);
      d.showModal();
      input.current?.focus();
    }
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
    // optionId is stable for a given uid
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const run = useCallback(
    (item: CommandItem | undefined) => {
      if (!item) return;
      onOpenChange(false);
      if (item.externo) window.open(item.href, "_blank", "noopener,noreferrer");
      else router.push(item.href as Route);
    },
    [onOpenChange, router],
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    const last = results.length - 1;
    if (event.key === "ArrowDown") setActive((a) => (a >= last ? 0 : a + 1));
    else if (event.key === "ArrowUp") setActive((a) => (a <= 0 ? last : a - 1));
    else if (event.key === "Home") setActive(0);
    else if (event.key === "End") setActive(last);
    else if (event.key === "Enter") run(results[active]);
    else return;
    event.preventDefault();
  };

  let index = -1;
  return (
    <dialog
      ref={dialog}
      aria-label="Buscar o hacer algo"
      onClose={() => onOpenChange(false)}
      onClick={(event) => event.target === event.currentTarget && onOpenChange(false)}
      className="mx-auto mt-3 w-[calc(100vw-1.5rem)] max-w-[640px] overflow-hidden rounded-[20px] border border-border bg-surface p-0 text-fg shadow-overlay backdrop:bg-scrim md:mt-[12vh]"
    >
      <div className="flex max-h-[80dvh] flex-col">
        <div className="flex items-center gap-3 border-b border-border px-5 focus-within:shadow-[inset_0_-2px_0_var(--fg)]">
          <Search aria-hidden="true" className="size-5 shrink-0 text-fg-muted" />
          <input
            ref={input}
            role="combobox"
            aria-expanded="true"
            aria-controls={`${uid}-lista`}
            aria-autocomplete="list"
            aria-activedescendant={results.length ? optionId(active) : undefined}
            aria-label="Buscar o hacer algo"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Busca o escribe una acción: pagar, entregar, horario…"
            className="h-16 min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-fg-muted focus-visible:outline-none"
          />
          <Kbd>Esc</Kbd>
        </div>

        <div
          id={`${uid}-lista`}
          role="listbox"
          aria-label="Resultados"
          className="overflow-y-auto px-2 py-2"
        >
          {results.length === 0 ? (
            <p className="px-3 py-10 text-center text-body text-fg-muted">
              Nada coincide con “{query}”. Prueba con un curso, una persona o “pagar”.
            </p>
          ) : (
            GROUP_ORDER.filter((g) => results.some((r) => r.grupo === g)).map((g) => (
              <div key={g} role="group" aria-labelledby={`${uid}-${g}`}>
                <p
                  id={`${uid}-${g}`}
                  className="px-3 pt-3 pb-1 text-caption font-semibold text-fg-muted"
                >
                  {g}
                </p>
                {results
                  .filter((r) => r.grupo === g)
                  .map((item) => {
                    index += 1;
                    const i = index;
                    const selected = i === active;
                    return (
                      <div
                        key={item.id}
                        id={optionId(i)}
                        role="option"
                        aria-selected={selected}
                        onMouseMove={() => setActive(i)}
                        onClick={() => run(item)}
                        className={cx(
                          "flex min-h-12 cursor-pointer items-center gap-3 rounded-md px-3 py-2",
                          selected && "bg-surface-subtle",
                        )}
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-sm border border-border">
                          {item.curso ? (
                            <CourseDot slot={item.curso} className="size-2.5" />
                          ) : (
                            item.icono && <Icon name={item.icono} className="size-4" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cx(
                              "block truncate text-body",
                              g === "Acciones" && "font-semibold",
                            )}
                          >
                            {item.titulo}
                          </span>
                          <span className="block truncate text-label text-fg-muted">
                            {item.detalle}
                          </span>
                        </span>
                        {item.externo && (
                          <ArrowUpRight aria-hidden="true" className="size-4 text-fg-muted" />
                        )}
                        {selected && <Kbd>Enter</Kbd>}
                      </div>
                    );
                  })}
              </div>
            ))
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-5 py-3 text-caption text-fg-muted">
          <span>
            <Kbd>↑</Kbd> <Kbd>↓</Kbd> moverte
          </span>
          <span>
            <Kbd>Enter</Kbd> hacerlo
          </span>
          <span>
            <Kbd>Esc</Kbd> cerrar
          </span>
          <span role="status" className="sr-only">
            {results.length === 1 ? "1 resultado" : `${results.length} resultados`}
          </span>
        </div>
      </div>
    </dialog>
  );
}
