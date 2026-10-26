"use client";

import { useRouter } from "next/navigation";
import { Lock, SearchX } from "lucide-react";
import { useTransition } from "react";

import type { PortError } from "@/lib/result";

import { EmptyState, ErrorState, TimeoutState } from "./states";

/**
 * What a section shows when its port answered with an error instead of data. Retry re-runs the
 * server render of the page (`router.refresh`), keeping scroll and client state.
 */
export function PortProblem({
  error,
  what = "esta información",
  className,
}: {
  error: PortError;
  what?: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const retry = () => start(() => router.refresh());
  if (error === "timeout")
    return <TimeoutState onRetry={retry} retrying={pending} className={className} />;
  if (error === "forbidden")
    return (
      <EmptyState
        reason="disabled"
        icon={<Lock aria-hidden="true" />}
        title="Tu rol no tiene acceso a esto"
        description="Si crees que deberías verlo, escríbele a Soporte con el nombre de la pantalla."
        className={className}
      />
    );
  if (error === "not_found")
    return (
      <EmptyState
        reason="disabled"
        icon={<SearchX aria-hidden="true" />}
        title="No encontramos lo que buscas"
        description="Puede que ya no exista o que el enlace esté incompleto."
        className={className}
      />
    );
  return (
    <ErrorState
      title={`No pudimos cargar ${what}`}
      onRetry={retry}
      retrying={pending}
      className={className}
    />
  );
}
