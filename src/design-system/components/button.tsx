import Link from "next/link";
import type { Route } from "next";
import type { ComponentProps, ReactNode } from "react";

import { cx } from "@/lib/cx";

import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "on-accent";
export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-linear-to-b from-accent-from to-accent-to text-on-accent shadow-[inset_0_1px_0_rgb(255_255_255/0.18)] hover:brightness-95",
  secondary: "border border-border-strong bg-surface text-fg hover:bg-surface-subtle",
  ghost: "text-fg hover:bg-surface-subtle",
  danger: "bg-danger-fill text-on-accent hover:brightness-95",
  // For actions placed on an accent-gradient surface (the featured card).
  "on-accent": "bg-white text-accent-to hover:bg-white/90",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 rounded-sm px-3 text-label [&_svg]:size-4",
  md: "h-10 gap-2 rounded-md px-4 text-label [&_svg]:size-4.5",
  lg: "h-12 gap-2 rounded-md px-5 text-body [&_svg]:size-5",
};

/**
 * Press feedback is instant and on pointer-down (`active:scale-[0.97]`, 140 ms ease-out);
 * hover only applies to fine pointers (Tailwind 4 gates `hover:` behind `(hover: hover)`).
 */
export function buttonClasses({
  variant = "secondary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  className?: string | undefined;
} = {}) {
  return cx(
    "relative inline-flex select-none items-center justify-center whitespace-nowrap font-medium",
    "transition-[transform,filter,background-color,border-color] duration-(--duration-press) ease-(--ease-out)",
    "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Keeps the button's width and shows a spinner; the label stays readable to assistive tech. */
  loading?: boolean;
  icon?: ReactNode;
};

export function Button({
  variant,
  size,
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      <span className={cx("inline-flex items-center gap-[inherit]", loading && "invisible")}>
        {icon}
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner />
        </span>
      )}
    </button>
  );
}

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: Route;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
};

export function ButtonLink({
  variant,
  size,
  icon,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...props}>
      {icon}
      {children}
    </Link>
  );
}

type IconButtonProps = Omit<ComponentProps<"button">, "aria-label" | "children"> & {
  /** Accessible name; icon-only buttons always need one. */
  label: string;
  icon: ReactNode;
  variant?: Exclude<ButtonVariant, "danger">;
  size?: ButtonSize;
};

const iconSizeClasses: Record<ButtonSize, string> = {
  sm: "size-8 rounded-sm [&_svg]:size-4",
  md: "size-10 rounded-md [&_svg]:size-5",
  lg: "size-12 rounded-md [&_svg]:size-5",
};

export function IconButton({
  label,
  icon,
  variant = "ghost",
  size = "md",
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cx(buttonClasses({ variant, size }), "px-0", iconSizeClasses[size], className)}
      {...props}
    >
      {icon}
    </button>
  );
}
