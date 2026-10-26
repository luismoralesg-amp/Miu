"use server";

import { revalidatePath } from "next/cache";

import { account, SensitiveField, type Privacy } from "@/modules/account";
import { devToolsEnabled, requireActor } from "@/modules/identity/session";

export async function pedirCodigoCuenta() {
  const actor = await requireActor();
  const r = await account().requestStepUp(actor);
  if (!r.ok)
    return { ok: false as const, error: "No pudimos enviar el código. Inténtalo de nuevo." };
  return {
    ok: true as const,
    ...(devToolsEnabled() && r.value.codigoPrueba ? { codigoPrueba: r.value.codigoPrueba } : {}),
  };
}

export async function revelar(campo: string, codigo: string) {
  const actor = await requireActor();
  const f = SensitiveField.safeParse(campo);
  if (!f.success) return { error: "Dato desconocido." };
  const r = await account().reveal(actor, f.data, codigo);
  return r.ok ? { valor: r.value } : { error: r.detail ?? "No se pudo mostrar." };
}

export async function actualizarContacto(
  input: {
    telefono: string;
    direccion: string;
    emergenciaNombre: string;
    emergenciaTelefono: string;
  },
  codigo: string,
) {
  const actor = await requireActor();
  const r = await account().updateContact(actor, input, codigo);
  if (!r.ok) return { error: r.detail ?? "No se pudo guardar." };
  revalidatePath("/cuenta/informacion");
  return { ok: true as const };
}

export async function guardarPrivacidad(privacy: Privacy) {
  const actor = await requireActor();
  const r = await account().setPrivacy(actor, privacy);
  return r.ok ? { ok: true as const } : { error: "No se pudo guardar." };
}

export async function permisoDrive(form: FormData) {
  const actor = await requireActor();
  await account().setDriveConsent(actor, form.get("permitir") === "1");
  revalidatePath("/cuenta/archivos");
}
