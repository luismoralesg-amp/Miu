import Link from "next/link";
import { redirect } from "next/navigation";

import { maskEmail } from "@/modules/identity";
import { pendingEmail } from "@/modules/identity/session";

import { CodeForm, ResendForm } from "../forms";
import { DevOutbox } from "../outbox";

export const metadata = { title: "Código" };

export default async function CodePage() {
  const correo = await pendingEmail();
  if (!correo) redirect("/login");
  return (
    <div className="flex reveal flex-col gap-8">
      <div>
        <h1 className="display text-[40px] leading-[1.05] font-medium md:text-[48px]">
          Revisa tu correo
        </h1>
        <p className="mt-2 text-body text-fg-muted">
          Enviamos un código a <span className="font-semibold text-fg">{maskEmail(correo)}</span>.
          Vence en 10 minutos.
        </p>
      </div>
      <CodeForm />
      <div className="flex flex-col gap-3 border-t border-border pt-6 text-label">
        <ResendForm />
        <Link
          href="/login/enlace"
          className="self-start text-fg-muted underline underline-offset-4 hover:text-fg"
        >
          Prefiero entrar con el enlace del correo
        </Link>
        <Link
          href="/login"
          className="self-start text-fg-muted underline underline-offset-4 hover:text-fg"
        >
          Usar otro correo
        </Link>
      </div>
      <DevOutbox correo={correo} />
    </div>
  );
}
