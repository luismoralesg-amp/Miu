"use client";

import { CircleAlert, Clock, RotateCw } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { cx } from "@/lib/cx";

import { Button } from "./button";

/* ---------- Loading ---------- */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cx("animate-pulse-soft rounded-sm bg-surface-subtle", className)}
    />
  );
}

/**
 * Wraps skeleton placeholders. Screen readers hear one "Cargando…" instead of a pile of empty boxes.
 */
export function LoadingRegion({
  label = "Cargando…",
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/**
 * Content that replaces a skeleton fades and slides up 8px, staggered 40 ms per index.
 * Pure CSS: it runs off the main thread and needs no hydration. Reduced motion keeps only the fade.
 */
export function Reveal({
  index = 0,
  className,
  children,
}: {
  index?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cx("reveal", className)} style={{ "--i": index } as CSSProperties}>
      {children}
    </div>
  );
}

/* ---------- Empty, error and timeout ---------- */

type StateProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string | undefined;
};

function StateLayout({
  icon,
  iconTone,
  title,
  description,
  action,
  className,
  role,
}: StateProps & { icon: ReactNode; iconTone: string; role?: "alert" | "status" }) {
  return (
    <div
      role={role}
      className={cx("flex flex-col items-center gap-3 px-6 py-10 text-center", className)}
    >
      <span className={cx("grid size-11 place-items-center rounded-full [&_svg]:size-5", iconTone)}>
        {icon}
      </span>
      <div className="flex max-w-sm flex-col gap-1">
        <p className="text-body font-semibold text-fg">{title}</p>
        {description && <p className="text-label text-fg-muted">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/**
 * Explains why there is nothing and what to do. `reason="disabled"` separates "the teacher did not
 * enable this" from "nothing published yet", which MiU never distinguished.
 */
export function EmptyState({
  icon,
  reason = "empty",
  ...props
}: StateProps & { icon: ReactNode; reason?: "empty" | "disabled" }) {
  return (
    <StateLayout
      {...props}
      icon={icon}
      iconTone={
        reason === "disabled"
          ? "bg-surface-subtle text-fg-muted"
          : "bg-accent-soft text-accent-soft-fg"
      }
    />
  );
}

type RetryProps = {
  onRetry?: () => void;
  retrying?: boolean;
};

export function ErrorState({
  title = "No pudimos cargar esta información",
  description = "Revisa tu conexión e inténtalo de nuevo. Si el problema sigue, avísanos desde Soporte.",
  onRetry,
  retrying = false,
  className,
}: Partial<StateProps> & RetryProps) {
  return (
    <StateLayout
      role="alert"
      icon={<CircleAlert aria-hidden="true" />}
      iconTone="bg-danger-soft text-danger-fg"
      title={title}
      description={description}
      className={className}
      action={
        onRetry && (
          <Button
            size="sm"
            onClick={onRetry}
            loading={retrying}
            icon={<RotateCw aria-hidden="true" />}
          >
            Reintentar
          </Button>
        )
      }
    />
  );
}

/** Shown when a request outlives its time budget (≤ 10 s), so nothing ever hangs in silence. */
export function TimeoutState({
  title = "Esto está tardando más de lo normal",
  description = "El servicio no respondió a tiempo. Puedes reintentar ahora; tus datos no se perdieron.",
  onRetry,
  retrying = false,
  className,
}: Partial<StateProps> & RetryProps) {
  return (
    <StateLayout
      role="alert"
      icon={<Clock aria-hidden="true" />}
      iconTone="bg-warning-soft text-warning-fg"
      title={title}
      description={description}
      className={className}
      action={
        onRetry && (
          <Button
            size="sm"
            onClick={onRetry}
            loading={retrying}
            icon={<RotateCw aria-hidden="true" />}
          >
            Reintentar
          </Button>
        )
      }
    />
  );
}
