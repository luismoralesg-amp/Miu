"use client";

import { KeyRound } from "lucide-react";
import { useActionState, useRef } from "react";

import { Button, Checkbox, TextField } from "@/design-system/components";
import { buttonClasses } from "@/design-system/components/button";

import {
  entrarConEnlace,
  entrarConGoogle,
  entrarConPasskey,
  iniciarConCorreo,
  reenviarCodigo,
  verificarCodigo,
  type FormState,
} from "./actions";

function Mensaje({ state }: { state: FormState }) {
  if (state.error)
    return (
      <p role="alert" className="text-label text-danger-fg">
        {state.error}
      </p>
    );
  if (state.aviso)
    return (
      <p role="status" className="text-label text-fg-muted">
        {state.aviso}
      </p>
    );
  return null;
}

export function EmailForm() {
  const [state, action, pending] = useActionState(iniciarConCorreo, {});
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <TextField
        label="Correo de la UFM"
        name="correo"
        type="email"
        inputMode="email"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="nombre@ufm.edu"
        defaultValue={state.correo}
        error={state.error}
        required
        autoFocus
      />
      <Button type="submit" variant="primary" size="lg" loading={pending}>
        Continuar
      </Button>
    </form>
  );
}

/**
 * `real`: Google's credentials are loaded, so this is a link to the route that starts the OpenID flow.
 * Otherwise it is the form that signs in the simulated demo student (see google/signin.ts).
 */
export function GoogleButton({ real = false, notice }: { real?: boolean; notice?: string }) {
  const [state, action, pending] = useActionState(entrarConGoogle, {});
  if (real)
    return (
      <div className="flex flex-col gap-2">
        {/* A full navigation to a route handler on purpose: not a client-side <Link>. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/login/google/start"
          className={buttonClasses({ size: "lg", className: "w-full" })}
        >
          Continuar con Google
        </a>
        {notice && <Mensaje state={{ error: notice }} />}
      </div>
    );
  return (
    <form action={action} className="flex flex-col gap-2">
      <Button type="submit" size="lg" loading={pending} className="w-full">
        Continuar con Google
      </Button>
      <Mensaje state={notice ? { error: notice } : state} />
    </form>
  );
}

export function PasskeyButton() {
  const [state, action, pending] = useActionState(entrarConPasskey, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <Button
        type="submit"
        variant="ghost"
        size="lg"
        loading={pending}
        icon={<KeyRound aria-hidden="true" />}
        className="w-full"
      >
        Usar una passkey
      </Button>
      <Mensaje state={state} />
    </form>
  );
}

export function CodeForm() {
  const [state, action, pending] = useActionState(verificarCodigo, {});
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={action} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="codigo" className="text-label font-medium">
          Código de 6 dígitos
        </label>
        <input
          id="codigo"
          name="codigo"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          autoFocus
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "codigo-error" : undefined}
          onChange={(event) => {
            const digits = event.currentTarget.value.replace(/\D/g, "").slice(0, 6);
            event.currentTarget.value = digits;
            // Response is immediate: the sixth digit submits (apple-design §1).
            if (digits.length === 6 && !pending) form.current?.requestSubmit();
          }}
          className="h-16 w-full rounded-md border border-border-control bg-surface text-center display text-[34px] tracking-[0.4em] text-fg focus-visible:border-focus focus-visible:ring-3 focus-visible:ring-focus/25 focus-visible:outline-none aria-invalid:border-danger-fg"
        />
        {state.error && (
          <p id="codigo-error" role="alert" className="text-label text-danger-fg">
            {state.error}
          </p>
        )}
      </div>
      <Checkbox
        name="recordar"
        label="Recordar este dispositivo durante 30 días"
        description="Así podrás entrar después con una passkey."
      />
      <Button type="submit" variant="primary" size="lg" loading={pending}>
        Entrar
      </Button>
    </form>
  );
}

export function ResendForm() {
  const [state, action, pending] = useActionState(reenviarCodigo, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <button
        type="submit"
        aria-busy={pending || undefined}
        className="min-h-11 self-start text-fg-muted underline underline-offset-4 hover:text-fg aria-busy:opacity-60"
      >
        {pending ? "Enviando…" : "Enviar otro código"}
      </button>
      <Mensaje state={state} />
    </form>
  );
}

export function LinkForm({ token, correo }: { token: string; correo: string }) {
  const [state, action, pending] = useActionState(entrarConEnlace, {});
  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      <p className="text-body text-fg-muted">
        Vas a entrar como <span className="font-semibold text-fg">{correo}</span>.
      </p>
      <Checkbox name="recordar" label="Recordar este dispositivo durante 30 días" />
      <Button type="submit" variant="primary" size="lg" loading={pending}>
        Entrar a MiU
      </Button>
      <Mensaje state={state} />
    </form>
  );
}
