"use client";

import { CircleAlert, Send } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/design-system/components";
import type { SendState } from "@/app/(app)/comunicacion/actions";

/** Write and send; ⌘/Ctrl + Enter sends. On error the text stays so nothing is lost. */
export function Composer({
  action,
  para,
}: {
  action: (prev: SendState, form: FormData) => Promise<SendState>;
  para: string;
}) {
  const [state, submit, pending] = useActionState(action, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.enviado) form.current?.reset();
  }, [state.enviado]);
  return (
    <form ref={form} action={submit} className="flex flex-col gap-2 border-t border-border pt-4">
      <label htmlFor="texto" className="sr-only">
        Mensaje para {para}
      </label>
      <textarea
        id="texto"
        name="texto"
        rows={3}
        required
        maxLength={2000}
        placeholder={`Escribe a ${para}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            form.current?.requestSubmit();
          }
        }}
        className="rounded-md border border-border-control bg-surface p-3 text-body"
      />
      {state.error && (
        <p role="alert" className="flex items-center gap-1.5 text-label text-danger-fg">
          <CircleAlert aria-hidden="true" className="size-4" />
          {state.error}
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <p className="text-caption text-fg-muted">⌘ o Ctrl + Enter para enviar</p>
        <Button
          type="submit"
          variant="ink"
          pill
          loading={pending}
          icon={<Send aria-hidden="true" />}
        >
          Enviar
        </Button>
      </div>
    </form>
  );
}
