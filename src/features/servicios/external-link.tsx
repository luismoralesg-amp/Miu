import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

/** Any link that leaves MiU says so, visually and to screen readers. */
export function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cx("inline-flex items-center gap-1 underline underline-offset-4", className)}
    >
      {children}
      <ArrowUpRight aria-hidden="true" className="size-4" />
      <span className="sr-only">(se abre fuera de MiU)</span>
    </a>
  );
}
