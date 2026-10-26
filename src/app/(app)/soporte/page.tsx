import type { Metadata } from "next";

import { PortProblem } from "@/design-system/components";
import { Help } from "@/features/soporte/help";
import { support } from "@/modules/support";
import { requireActor } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Soporte y ayuda" };

type Props = { searchParams: Promise<{ desde?: string }> };

export default async function SoportePage({ searchParams }: Props) {
  await requireActor();
  const desde = ((await searchParams).desde ?? "").startsWith("/")
    ? ((await searchParams).desde ?? "")
    : "";
  const faq = await support().listFaq();
  return (
    <div className="pb-10">
      <section className="reveal pt-10 pb-8 md:pt-14 md:pb-10">
        <p className="text-[15px] text-fg-muted">
          Respuestas rápidas y un chat que ya sabe quién eres
        </p>
        <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium md:text-[64px]">
          Soporte
        </h1>
      </section>
      {faq.ok ? (
        <Help faq={faq.value} desde={desde} />
      ) : (
        <PortProblem error={faq.error} what="la ayuda" />
      )}
    </div>
  );
}
