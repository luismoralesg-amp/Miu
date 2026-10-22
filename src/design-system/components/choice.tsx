"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";

import { cx } from "@/lib/cx";

type CheckboxProps = Omit<ComponentProps<"input">, "type"> & {
  label: ReactNode;
  description?: ReactNode;
};

export function Checkbox({ label, description, id, className, ...props }: CheckboxProps) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <div className={cx("flex items-start gap-3", className)}>
      <input
        id={inputId}
        type="checkbox"
        aria-describedby={description ? `${inputId}-description` : undefined}
        className="mt-0.5 size-5 shrink-0 cursor-pointer accent-accent-to"
        {...props}
      />
      <div className="flex flex-col gap-0.5">
        <label htmlFor={inputId} className="cursor-pointer text-body text-fg">
          {label}
        </label>
        {description && (
          <p id={`${inputId}-description`} className="text-label text-fg-muted">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

type RadioOption = { value: string; label: ReactNode; description?: ReactNode };

type RadioGroupProps = {
  name: string;
  legend: ReactNode;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
};

export function RadioGroup({
  name,
  legend,
  options,
  value,
  defaultValue,
  onValueChange,
  className,
}: RadioGroupProps) {
  const groupId = useId();
  return (
    <fieldset className={cx("flex flex-col gap-3", className)}>
      <legend className="mb-1 text-label font-medium text-fg">{legend}</legend>
      {options.map((option) => {
        const optionId = `${groupId}-${option.value}`;
        return (
          <div key={option.value} className="flex items-start gap-3">
            <input
              id={optionId}
              type="radio"
              name={name}
              value={option.value}
              {...(value !== undefined
                ? { checked: value === option.value }
                : { defaultChecked: defaultValue === option.value })}
              onChange={() => onValueChange?.(option.value)}
              aria-describedby={option.description ? `${optionId}-description` : undefined}
              className="mt-0.5 size-5 shrink-0 cursor-pointer accent-accent-to"
            />
            <div className="flex flex-col gap-0.5">
              <label htmlFor={optionId} className="cursor-pointer text-body text-fg">
                {option.label}
              </label>
              {option.description && (
                <p id={`${optionId}-description`} className="text-label text-fg-muted">
                  {option.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </fieldset>
  );
}

type SwitchProps = {
  label: ReactNode;
  description?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

/** On/off setting that applies immediately. For values submitted with a form, use Checkbox. */
export function Switch({
  label,
  description,
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled,
  className,
}: SwitchProps) {
  const id = useId();
  const [internal, setInternal] = useState(defaultChecked);
  const isOn = checked ?? internal;

  return (
    <div className={cx("flex items-start justify-between gap-4", className)}>
      <div className="flex flex-col gap-0.5">
        <label htmlFor={id} className="cursor-pointer text-body text-fg">
          {label}
        </label>
        {description && (
          <p id={`${id}-description`} className="text-label text-fg-muted">
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-describedby={description ? `${id}-description` : undefined}
        disabled={disabled}
        onClick={() => {
          const next = !isOn;
          if (checked === undefined) setInternal(next);
          onCheckedChange?.(next);
        }}
        className={cx(
          "group relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-0.5",
          "transition-[background-color] duration-(--duration-fast) ease-(--ease-out)",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isOn ? "bg-accent-to" : "bg-border-control",
        )}
      >
        <span
          aria-hidden="true"
          className={cx(
            "size-6 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.25)]",
            "transition-transform duration-(--duration-base) ease-(--ease-out) group-active:scale-x-110",
            isOn ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}
