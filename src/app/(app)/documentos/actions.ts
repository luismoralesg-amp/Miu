"use server";

import { redirect } from "next/navigation";

import { documents, DocumentKind } from "@/modules/documents";
import { requireActor } from "@/modules/identity/session";

export async function solicitarDocumento(form: FormData) {
  const actor = await requireActor();
  const tipo = DocumentKind.safeParse(form.get("tipo"));
  if (!tipo.success) redirect("/documentos?error=tipo" as never);
  const r = await documents().requestDocument(actor, tipo.data);
  redirect((r.ok ? "/documentos?solicitado=1" : "/documentos?error=solicitud") as never);
}
