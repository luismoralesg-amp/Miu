"use server";

import { revalidatePath } from "next/cache";

import { can } from "@/authz";
import { subjectFor } from "@/authz/subject";
import { assessment } from "@/modules/assessment";
import { requireActor } from "@/modules/identity/session";
import { storage } from "@/modules/storage";

export type SubmitState = { error?: string; recibo?: string };

const MESSAGES: Record<string, string> = {
  timeout: "El servidor tardó demasiado. Tu archivo no se entregó; inténtalo de nuevo.",
  unavailable:
    "No pudimos entregar ahora. Tu archivo no se perdió: vuelve a intentarlo en un momento.",
  forbidden: "Esta entrega no te corresponde.",
  not_found: "No encontramos la actividad.",
};

/**
 * Hand in work: the file (or text, or repository link) is stored, fingerprinted and scanned first,
 * then the submission is recorded with that fingerprint. Nothing is recorded if any step fails.
 */
export async function entregar(
  activityId: string,
  _prev: SubmitState,
  form: FormData,
): Promise<SubmitState> {
  const actor = await requireActor();
  if (!can(await subjectFor(actor), "submit", { ownerId: actor.personId }))
    return { error: MESSAGES.forbidden! };

  const archivo = form.get("archivo");
  const texto = String(form.get("texto") ?? "").trim();
  const url = String(form.get("url") ?? "").trim();
  let upload: { nombre: string; tipo: string; bytes: Uint8Array };
  if (archivo instanceof File && archivo.size > 0) {
    upload = {
      nombre: archivo.name,
      tipo: archivo.type,
      bytes: new Uint8Array(await archivo.arrayBuffer()),
    };
  } else if (texto) {
    if (texto.split(/\s+/).length < 20)
      return { error: "Escribe al menos 20 palabras antes de entregar." };
    upload = {
      nombre: "comentario.txt",
      tipo: "text/plain",
      bytes: new TextEncoder().encode(texto),
    };
  } else if (url) {
    if (!/^https:\/\/\S+$/.test(url)) return { error: "El enlace debe empezar con https://" };
    upload = {
      nombre: "repositorio.url",
      tipo: "text/uri-list",
      bytes: new TextEncoder().encode(url),
    };
  } else {
    return { error: "Elige un archivo, escribe tu respuesta o pega el enlace antes de entregar." };
  }

  const stored = await storage().put(actor, upload);
  if (!stored.ok)
    return {
      error:
        stored.detail && stored.error === "invalid"
          ? stored.detail
          : (MESSAGES[stored.error] ?? "No se pudo guardar el archivo."),
    };
  const result = await assessment().submit(actor, activityId, {
    archivo: stored.value.nombre,
    tamanoBytes: stored.value.tamanoBytes,
    hash: stored.value.hash,
  });
  if (!result.ok)
    return {
      error:
        result.error === "invalid" && result.detail
          ? result.detail
          : (MESSAGES[result.error] ?? "No se pudo entregar."),
    };
  revalidatePath("/", "layout");
  return { recibo: result.value.recibo };
}
