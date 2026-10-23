import Link from "next/link";

import { EmptyState } from "@/design-system/components";
import { identity, maskEmail } from "@/modules/identity";
import { pendingEmail } from "@/modules/identity/session";
import { Link2Off } from "lucide-react";

import { LinkForm, ResendForm } from "../forms";
import { DevOutbox } from "../outbox";

export const metadata = { title: "Enlace de acceso" };

/**
 * Opening the link does not sign in by itself: a confirmation step keeps mail scanners that prefetch
 * links from consuming them.
 */
export default async function LinkPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (token) {
    const link = await identity().peekMagicLink(token);
    if (!link.ok)
      return (
        <EmptyState
          icon={<Link2Off aria-hidden="true" />}
          title="Este enlace ya no sirve"
          description="Se usó antes o pasaron más de 10 minutos. Pide uno nuevo."
          action={
            <Link href="/login" className="underline underline-offset-4">
              Volver a entrar
            </Link>
          }
        />
      );
    return (
      <div className="flex reveal flex-col gap-6">
        <h1 className="display text-[40px] leading-[1.05] font-medium md:text-[48px]">
          Confirma que eres tú
        </h1>
        <LinkForm token={token} correo={maskEmail(link.value.correo)} />
      </div>
    );
  }

  const correo = await pendingEmail();
  return (
    <div className="flex reveal flex-col gap-8">
      <div>
        <h1 className="display text-[40px] leading-[1.05] font-medium md:text-[48px]">
          Abre el enlace del correo
        </h1>
        <p className="mt-2 text-body text-fg-muted">
          {correo ? (
            <>
              Lo enviamos a <span className="font-semibold text-fg">{maskEmail(correo)}</span> junto
              con el código. Funciona una sola vez durante 10 minutos.
            </>
          ) : (
            "Escribe tu correo en el inicio de sesión y te enviaremos un enlace."
          )}
        </p>
      </div>
      <div className="flex flex-col gap-3 border-t border-border pt-6 text-label">
        {correo && <ResendForm />}
        <Link
          href={correo ? "/login/codigo" : "/login"}
          className="self-start text-fg-muted underline underline-offset-4 hover:text-fg"
        >
          {correo ? "Prefiero escribir el código" : "Ir al inicio de sesión"}
        </Link>
      </div>
      <DevOutbox correo={correo} />
    </div>
  );
}
