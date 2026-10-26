"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-label font-medium transition-colors duration-150 hover:bg-surface-subtle active:scale-[0.97]"
    >
      <Printer aria-hidden="true" className="size-4" />
      Imprimir
    </button>
  );
}
