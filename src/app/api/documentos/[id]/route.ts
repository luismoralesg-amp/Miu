import { currentUser } from "@/modules/identity/session";

/**
 * Mock download: a small text file standing in for the course document, only for signed-in users.
 * The real file comes from StoragePort with a signed, short-lived URL.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await currentUser())) return new Response("Inicia sesión para descargar.", { status: 401 });
  const { id } = await params;
  if (!/^[a-z0-9-]{1,60}$/.test(id)) return new Response("No encontrado", { status: 404 });
  const body = `MiU Nuevo · documento de ejemplo (${id}).\nEn producción, este archivo viene de StoragePort.\n`;
  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="${id}.txt"`,
      "cache-control": "private, no-store",
    },
  });
}
