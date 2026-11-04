import type { Metadata } from "next";
import { CircleCheck } from "lucide-react";

import { ExternalLink } from "@/features/servicios/external-link";
import { PageHead } from "@/features/servicios/page-head";
import { requireActor } from "@/modules/identity/session";

export const metadata: Metadata = { title: "ChatGPT Edu" };

/** Account status is an example until the licensing system is connected [S]. */
export default async function ChatgptPage() {
  const actor = await requireActor();
  return (
    <div className="pb-10">
      <PageHead kicker="Licencia institucional" title="ChatGPT Edu" />
      <div className="max-w-xl rounded-[20px] border border-border bg-surface p-6">
        <p className="flex items-center gap-2 font-semibold">
          <CircleCheck aria-hidden="true" className="size-5 text-success-fg" />
          Tu cuenta está activa
        </p>
        <p className="mt-2 text-[15px] text-fg-muted">
          Entra con tu correo de la UFM, {actor.nombre.split(" ")[0]}. Tus conversaciones no se usan
          para entrenar modelos.
        </p>
        <ExternalLink href="https://chatgpt.com" className="mt-5 text-[15px] font-semibold">
          Abrir ChatGPT
        </ExternalLink>
      </div>
      <h2 className="mt-10 font-semibold">Antes de usarlo en un curso</h2>
      <ul className="mt-3 flex max-w-xl list-disc flex-col gap-2 pl-5 text-[15px]">
        <li>Cada catedrático define si se permite y cómo citarlo; revisa el programa del curso.</li>
        <li>No compartas datos personales de otras personas en tus conversaciones.</li>
      </ul>
      <p className="mt-8 text-caption text-fg-muted">Estado de licencia de ejemplo.</p>
    </div>
  );
}
