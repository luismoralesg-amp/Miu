import Image from "next/image";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ComponentProps, CSSProperties, ReactNode } from "react";

import { cx } from "@/lib/cx";

/* ---------- Badge ---------- */

export type Tone = "neutral" | "accent" | "info" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-subtle text-fg-muted",
  accent: "bg-accent-soft text-accent-soft-fg",
  info: "bg-info-soft text-info-fg",
  success: "bg-success-soft text-success-fg",
  warning: "bg-warning-soft text-warning-fg",
  danger: "bg-danger-soft text-danger-fg",
};

export function Badge({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex h-6 items-center gap-1 rounded-sm px-2 text-caption font-medium whitespace-nowrap [&_svg]:size-3.5",
        toneClasses[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/* ---------- Kbd ---------- */

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-border-strong bg-surface px-1 font-sans text-caption text-fg-muted">
      {children}
    </kbd>
  );
}

/* ---------- Avatar ---------- */

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (
    (parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")
  ).toUpperCase();
}

const avatarSizes = { sm: 28, md: 36, lg: 48 } as const;

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string;
  size?: keyof typeof avatarSizes;
  className?: string;
}) {
  const px = avatarSizes[size];
  const style: CSSProperties = { width: px, height: px };
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={px}
        height={px}
        style={style}
        className={cx("rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={name}
      style={style}
      className={cx(
        "inline-grid shrink-0 place-items-center rounded-full bg-accent-soft font-medium text-accent-soft-fg",
        size === "lg" ? "text-body" : "text-caption",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

/* ---------- Card and bento grid ---------- */

type CardProps = Omit<ComponentProps<"section">, "ref"> & {
  as?: "section" | "article" | "div";
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** `flush` drops the padding for edge-to-edge lists and tables. */
  padding?: "default" | "flush";
  /** Heading level of the title, so cards nest correctly under page sections. */
  titleLevel?: 2 | 3;
};

/** Light mode floats on a soft shadow; dark mode swaps the shadow for a 1px border. */
export function Card({
  as: Element = "section",
  title,
  description,
  action,
  padding = "default",
  titleLevel = 2,
  className,
  children,
  ...props
}: CardProps) {
  const Heading = titleLevel === 3 ? "h3" : "h2";
  const hasHeader = Boolean(title || action);
  return (
    <Element
      className={cx(
        "flex flex-col rounded-lg border border-border bg-surface",
        padding === "default" && "p-6",
        className,
      )}
      {...props}
    >
      {hasHeader && (
        <header
          className={cx(
            "flex items-start justify-between gap-4",
            padding === "flush" ? "px-6 pt-6 pb-4" : "mb-4",
          )}
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            {title && <Heading className="text-title-3 font-semibold text-fg">{title}</Heading>}
            {description && <p className="text-label text-fg-muted">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </Element>
  );
}

export function BentoGrid({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx("grid grid-cols-1 gap-3 md:grid-cols-6 lg:grid-cols-12", className)}>
      {children}
    </div>
  );
}

const spanClasses = {
  third: "md:col-span-3 lg:col-span-4",
  half: "md:col-span-3 lg:col-span-6",
  "two-thirds": "md:col-span-6 lg:col-span-8",
  full: "md:col-span-6 lg:col-span-12",
} as const;

export function BentoItem({
  span = "third",
  tall = false,
  className,
  children,
}: {
  span?: keyof typeof spanClasses;
  tall?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        "flex min-w-0 flex-col [&>*]:flex-1",
        spanClasses[span],
        tall && "lg:row-span-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ---------- Stat tile ---------- */

type Delta = {
  value: string;
  direction: "up" | "down";
  tone: "success" | "danger" | "neutral";
  label: string;
};

/** The one big number on a card: huge and bold, with a small muted label (reference §3). */
export function Stat({
  label,
  value,
  unit,
  delta,
  footnote,
  size = "metric",
}: {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  delta?: Delta;
  footnote?: ReactNode;
  size?: "metric" | "display";
}) {
  const Arrow = delta?.direction === "down" ? ArrowDownRight : ArrowUpRight;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-label text-fg-muted">{label}</p>
      <p className="flex items-baseline gap-1.5">
        <span
          className={cx(
            "font-semibold text-fg tabular",
            size === "display" ? "text-metric md:text-display" : "text-metric",
          )}
        >
          {value}
        </span>
        {unit && <span className="text-body text-fg-muted">{unit}</span>}
      </p>
      {(delta || footnote) && (
        <div className="flex flex-wrap items-center gap-2">
          {delta && (
            <Badge tone={delta.tone} icon={<Arrow aria-hidden="true" />}>
              <span className="sr-only">{delta.label}: </span>
              {delta.value}
            </Badge>
          )}
          {footnote && <span className="text-label text-fg-muted">{footnote}</span>}
        </div>
      )}
    </div>
  );
}

/* ---------- Progress ring and sparkline ---------- */

export function ProgressRing({
  value,
  max,
  label,
  size = 72,
  children,
}: {
  value: number;
  max: number;
  label: string;
  size?: number;
  children?: ReactNode;
}) {
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-surface-subtle"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-accent-to transition-[stroke-dashoffset] duration-(--duration-reveal) ease-(--ease-out)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
        />
      </svg>
      {children && (
        <span className="absolute text-label font-semibold text-fg tabular">{children}</span>
      )}
    </div>
  );
}

/** Decorative trend line. Pair it with a text summary for assistive tech. */
export function Sparkline({
  points,
  summary,
  width = 120,
  height = 36,
  className,
}: {
  points: number[];
  summary: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = points.length > 1 ? width / (points.length - 1) : 0;
  const coords = points.map(
    (p, i) =>
      `${(i * step).toFixed(1)},${(height - 3 - ((p - min) / span) * (height - 6)).toFixed(1)}`,
  );
  return (
    <span className={cx("inline-flex", className)}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
        className="overflow-visible"
      >
        <polyline
          points={coords.join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="sr-only">{summary}</span>
    </span>
  );
}

/* ---------- Course mark ---------- */

export type CourseSlot = 1 | 2 | 3 | 4 | 5 | 6;

const courseBg: Record<CourseSlot, string> = {
  1: "bg-course-1",
  2: "bg-course-2",
  3: "bg-course-3",
  4: "bg-course-4",
  5: "bg-course-5",
  6: "bg-course-6",
};

/** Course identity as a small mark next to its name. Never a fill behind text; the name carries meaning. */
export function CourseDot({ slot, className }: { slot: CourseSlot; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx("inline-block size-2 shrink-0 rounded-full", courseBg[slot], className)}
    />
  );
}
