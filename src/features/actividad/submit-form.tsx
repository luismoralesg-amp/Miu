"use client";

import { CircleAlert, FileUp, Upload } from "lucide-react";
import { useActionState, useId, useState } from "react";

import { Button } from "@/design-system/components";
import { cx } from "@/lib/cx";
import type { SubmissionMode } from "@/modules/assessment";
import type { SubmitState } from "@/app/(app)/cursos/[cursoId]/actividades/[actividadId]/actions";

const kb = (n: number) =>
  n >= 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(n / 1024))} KB`;

/**
 * The hand-in box. A dropped or chosen file shows its name and size before sending; text and
 * repository links get their own fields. Errors say what happened and that nothing was lost.
 */
export function SubmitForm({
  action,
  modo,
  formato,
  reemplazo,
}: {
  action: (prev: SubmitState, form: FormData) => Promise<SubmitState>;
  modo: SubmissionMode;
  formato: string;
  reemplazo: boolean;
}) {
  const [state, submit, pending] = useActionState(action, {});
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [texto, setTexto] = useState("");
  const id = useId();
  const palabras = texto.trim() ? texto.trim().split(/\s+/).length : 0;
  const listo = modo === "archivo" ? Boolean(file) : modo === "texto" ? palabras >= 20 : true;

  return (
    <form
      action={submit}
      className="flex flex-col gap-3"
      aria-describedby={state.error ? `${id}-err` : undefined}
    >
      {modo === "archivo" && (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files[0];
            const input = e.currentTarget.querySelector("input");
            if (f && input) {
              const dt = new DataTransfer();
              dt.items.add(f);
              input.files = dt.files;
              setFile(f);
            }
          }}
          className={cx(
            "flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-5 text-center text-label transition-colors duration-150",
            drag ? "border-fg bg-surface-subtle" : "border-border-control hover:bg-surface-subtle",
            "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
          )}
        >
          {file ? (
            <>
              <FileUp aria-hidden="true" className="size-5" />
              <span className="font-semibold break-all text-fg">{file.name}</span>
              <span className="text-fg-muted">{kb(file.size)} · toca para cambiarlo</span>
            </>
          ) : (
            <>
              <Upload aria-hidden="true" className="size-5 text-fg-muted" />
              <span className="text-fg">Suelta el archivo o elígelo</span>
              <span className="text-fg-muted">{formato} · hasta 10 MB</span>
            </>
          )}
          <input
            type="file"
            name="archivo"
            aria-label="Archivo para entregar"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
      {modo === "texto" && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-texto`} className="text-label font-medium">
            Tu respuesta
          </label>
          <textarea
            id={`${id}-texto`}
            name="texto"
            rows={8}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="rounded-md border border-border-control bg-surface p-3 text-body"
            aria-describedby={`${id}-cuenta`}
          />
          <p id={`${id}-cuenta`} className="text-caption text-fg-muted tabular">
            {palabras} {palabras === 1 ? "palabra" : "palabras"} · {formato}
          </p>
        </div>
      )}
      {modo === "repositorio" && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-url`} className="text-label font-medium">
            Enlace al repositorio
          </label>
          <input
            id={`${id}-url`}
            name="url"
            type="url"
            inputMode="url"
            required
            placeholder="https://"
            pattern="https://.+"
            className="h-12 rounded-md border border-border-control bg-surface px-3 text-body"
          />
        </div>
      )}
      {state.error && (
        <p
          id={`${id}-err`}
          role="alert"
          className="flex items-start gap-2 text-label text-danger-fg"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {state.error}
        </p>
      )}
      <Button
        type="submit"
        variant="ink"
        size="lg"
        loading={pending}
        disabled={!listo}
        className="rounded-full"
      >
        {reemplazo ? "Reemplazar entrega" : "Entregar"}
      </Button>
      <p className="text-caption text-fg-muted">
        Recibirás un comprobante con la hora y la huella (SHA-256) de lo que entregaste.
      </p>
    </form>
  );
}
