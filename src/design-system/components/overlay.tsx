"use client";

import { X } from "lucide-react";
import {
  cloneElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

import { cx } from "@/lib/cx";

import { IconButton } from "./button";

/* ---------- Dialog ---------- */

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/**
 * Native `<dialog>` for focus trapping, Escape and the top layer. Only ever opened by the user:
 * MiU's blocking modal on page load is exactly what this redesign removes.
 * Enters from the center (modals are not anchored to a trigger) and leaves faster than it came.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={() => onOpenChange(false)}
      onClick={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
      className={cx("miu-dialog", className)}
    >
      <div className="flex flex-col gap-4 p-6">
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="text-title-3 font-semibold text-fg">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="text-label text-fg-muted">
                {description}
              </p>
            )}
          </div>
          <IconButton
            label="Cerrar"
            size="sm"
            icon={<X aria-hidden="true" />}
            onClick={() => onOpenChange(false)}
            className="-mt-1 -mr-2"
          />
        </header>
        {children}
        {footer && <footer className="flex flex-wrap justify-end gap-2 pt-2">{footer}</footer>}
      </div>
    </dialog>
  );
}

/* ---------- Tooltip ---------- */

// Once one tooltip has shown, neighbours open instantly (emil-design-eng: skip delay when warm).
let lastClosedAt = 0;
const OPEN_DELAY_MS = 500;
const WARM_WINDOW_MS = 800;

type TooltipProps = {
  content: ReactNode;
  children: ReactElement<{
    "aria-describedby"?: string | undefined;
  }>;
  side?: "top" | "bottom";
};

/**
 * Supplementary text only; never the sole label of a control. Opens on hover after a short delay or
 * immediately on keyboard focus, and closes on Escape (WCAG 1.4.13).
 */
export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [instant, setInstant] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = (delay: number) => {
    clearTimeout(timer.current);
    const warm = Date.now() - lastClosedAt < WARM_WINDOW_MS;
    setInstant(warm);
    if (warm || delay === 0) setOpen(true);
    else timer.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setOpen((wasOpen) => {
      if (wasOpen) lastClosedAt = Date.now();
      return false;
    });
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && hide();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <span
      className="relative inline-flex"
      onPointerEnter={(event) => event.pointerType === "mouse" && show(OPEN_DELAY_MS)}
      onPointerLeave={hide}
      onFocus={() => show(0)}
      onBlur={hide}
    >
      {cloneElement(children, { "aria-describedby": id })}
      {/* Always present for assistive tech; the visible bubble only exists while open. */}
      <span id={id} role="tooltip" className="sr-only">
        {content}
      </span>
      {open && (
        <span
          aria-hidden="true"
          className={cx(
            "pointer-events-none absolute left-1/2 z-50 w-max max-w-64 -translate-x-1/2 rounded-sm px-2.5 py-1.5",
            "bg-fg text-caption font-medium text-bg shadow-overlay",
            "transition-[opacity,scale] duration-125 ease-(--ease-out) starting:scale-[0.97] starting:opacity-0",
            instant && "transition-none",
            side === "top" ? "bottom-full mb-2 origin-bottom" : "top-full mt-2 origin-top",
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
