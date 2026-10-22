"use client";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";

import { IconButton } from "./button";

const AUTO_HIDE_MS = 30_000;

export function maskValue(value: string, visible = 4): string {
  const tail = visible > 0 ? value.slice(-visible) : "";
  return `${"•".repeat(Math.max(value.length - visible, 3))}${tail}`;
}

/**
 * Sensitive personal data (CUI, birth date) is masked by default and hides itself again after 30 s.
 * `onRevealRequest` is where a step-up check (passkey or OTP) plugs in; returning false keeps it masked.
 */
export function MaskedValue({
  label,
  value,
  visible = 4,
  onRevealRequest,
}: {
  label: string;
  value: string;
  visible?: number;
  onRevealRequest?: () => Promise<boolean> | boolean;
}) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!revealed) return;
    const timer = setTimeout(() => setRevealed(false), AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [revealed]);

  const toggle = async () => {
    if (revealed) return setRevealed(false);
    const allowed = onRevealRequest ? await onRevealRequest() : true;
    if (allowed) setRevealed(true);
  };

  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-medium text-fg tabular">
        {revealed ? (
          value
        ) : (
          <>
            <span aria-hidden="true">{maskValue(value, visible)}</span>
            <span className="sr-only">
              {visible > 0
                ? `${label} oculto, termina en ${value.slice(-visible)}`
                : `${label} oculto`}
            </span>
          </>
        )}
      </span>
      <IconButton
        size="sm"
        label={revealed ? `Ocultar ${label}` : `Mostrar ${label}`}
        aria-pressed={revealed}
        icon={revealed ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        onClick={toggle}
      />
    </span>
  );
}
