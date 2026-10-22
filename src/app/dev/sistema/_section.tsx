import type { ReactNode } from "react";

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-title-2 font-semibold text-fg">{title}</h2>
        {description && <p className="max-w-2xl text-label text-fg-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}
