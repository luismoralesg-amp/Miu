import type { ReactNode } from "react";

/** The editorial heading every resource screen opens with. */
export function PageHead({ kicker, title }: { kicker: string; title: ReactNode }) {
  return (
    <section className="reveal pt-10 pb-8 md:pt-14 md:pb-10">
      <p className="text-[15px] text-fg-muted">{kicker}</p>
      <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium md:text-[64px]">
        {title}
      </h1>
    </section>
  );
}
