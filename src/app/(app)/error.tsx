"use client";

import { ErrorState } from "@/design-system/components";

/** Anything a page throws lands here, inside the shell, with a way to try again. */
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-16">
      <ErrorState
        title="Algo falló al mostrar esta pantalla"
        description="No perdiste nada. Inténtalo de nuevo; si sigue fallando, avísanos desde Soporte."
        onRetry={reset}
      />
    </div>
  );
}
