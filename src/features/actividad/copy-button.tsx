"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/** Copies a value and confirms in place for 2 s; screen readers hear the confirmation once. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard?.writeText(value);
        setDone(true);
        window.setTimeout(() => setDone(false), 2000);
      }}
      className="inline-flex min-h-11 items-center gap-1.5 text-label font-medium text-fg-muted transition-colors duration-150 hover:text-fg"
    >
      {done ? (
        <Check aria-hidden="true" className="size-4" />
      ) : (
        <Copy aria-hidden="true" className="size-4" />
      )}
      <span aria-live="polite">{done ? "Copiada" : label}</span>
    </button>
  );
}
