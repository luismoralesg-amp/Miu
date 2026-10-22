"use client";

import { ChevronDown, CircleAlert } from "lucide-react";
import { useId, type ComponentProps, type ReactNode } from "react";

import { cx } from "@/lib/cx";

type FieldFrameProps = {
  id: string;
  label: ReactNode;
  description?: ReactNode | undefined;
  error?: ReactNode | undefined;
  optional?: boolean | undefined;
  children: ReactNode;
};

/** Label, hint and inline error around a control. Errors validate inline, never only on submit. */
function FieldFrame({ id, label, description, error, optional, children }: FieldFrameProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label font-medium text-fg">
        {label}
        {optional && <span className="font-normal text-fg-muted"> (opcional)</span>}
      </label>
      {description && (
        <p id={`${id}-description`} className="text-label text-fg-muted">
          {description}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-label text-danger-fg">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, description: unknown, error: unknown) {
  const ids = [description ? `${id}-description` : null, error ? `${id}-error` : null];
  return ids.filter(Boolean).join(" ") || undefined;
}

const controlClasses = cx(
  "w-full rounded-md border border-border-control bg-surface px-3 text-body text-fg",
  "placeholder:text-fg-muted transition-[border-color,box-shadow] duration-(--duration-fast) ease-(--ease-out)",
  "focus-visible:border-focus focus-visible:ring-3 focus-visible:ring-focus/25 focus-visible:outline-none",
  "aria-invalid:border-danger-fg aria-invalid:focus-visible:ring-danger-fg/25",
  "disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:opacity-70",
);

type BaseFieldProps = {
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
};

export function TextField({
  label,
  description,
  error,
  optional,
  id,
  className,
  ...props
}: BaseFieldProps & ComponentProps<"input">) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <FieldFrame
      id={fieldId}
      label={label}
      description={description}
      error={error}
      optional={optional}
    >
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, description, error)}
        className={cx(controlClasses, "h-11", className)}
        {...props}
      />
    </FieldFrame>
  );
}

export function TextAreaField({
  label,
  description,
  error,
  optional,
  id,
  className,
  rows = 4,
  ...props
}: BaseFieldProps & ComponentProps<"textarea">) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <FieldFrame
      id={fieldId}
      label={label}
      description={description}
      error={error}
      optional={optional}
    >
      <textarea
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, description, error)}
        className={cx(controlClasses, "min-h-24 resize-y py-2.5", className)}
        {...props}
      />
    </FieldFrame>
  );
}

export function SelectField({
  label,
  description,
  error,
  optional,
  id,
  className,
  children,
  ...props
}: BaseFieldProps & ComponentProps<"select">) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <FieldFrame
      id={fieldId}
      label={label}
      description={description}
      error={error}
      optional={optional}
    >
      <div className="relative">
        <select
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fieldId, description, error)}
          className={cx(controlClasses, "h-11 appearance-none pr-10", className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4.5 -translate-y-1/2 text-fg-muted"
        />
      </div>
    </FieldFrame>
  );
}
