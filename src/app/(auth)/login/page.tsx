import { headers } from "next/headers";

import { googleMode, requestOrigin } from "@/modules/identity/google/signin";

import { EmailForm, GoogleButton, PasskeyButton } from "./forms";

const GOOGLE_NOTICES: Record<string, string> = {
  rechazado: "Google no confirmó una cuenta @ufm.edu verificada. Prueba con tu correo de la UFM.",
  no_disponible: "No pudimos hablar con Google. Entra con tu correo de la UFM.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string }>;
}) {
  const real = googleMode(requestOrigin(await headers(), "http://localhost:3000")).mode === "real";
  const notice = GOOGLE_NOTICES[(await searchParams).google ?? ""];
  return (
    <div className="flex reveal flex-col gap-8">
      <div>
        <h1 className="display text-[40px] leading-[1.05] font-medium md:text-[48px]">
          Entra a MiU
        </h1>
        <p className="mt-2 text-body text-fg-muted">
          Con tu correo de la UFM. Te enviamos un código; no necesitas contraseña.
        </p>
      </div>
      <EmailForm />
      <div className="flex items-center gap-4 text-label text-fg-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />o<span className="h-px flex-1 bg-border" />
      </div>
      <div className="flex flex-col gap-2">
        <GoogleButton real={real} {...(notice ? { notice } : {})} />
        <p className="text-center text-caption text-fg-muted">Solo cuentas @ufm.edu</p>
        <PasskeyButton />
      </div>
    </div>
  );
}
