import { quetzales } from "@/lib/clock";
import { ledger } from "@/modules/finance";
import { actorFor } from "@/modules/identity/actor";
import { currentUser } from "@/modules/identity/session";

/** A paid receipt as a plain-text file (the real system would issue the official PDF). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return new Response("Inicia sesión.", { status: 401 });
  const { id } = await params;
  const receipts = await ledger().listReceipts(actorFor(user.user, user.rol));
  const r = receipts.ok
    ? receipts.value.find((x) => x.id === id && x.estado === "pagado")
    : undefined;
  if (!r) return new Response("No encontrado", { status: 404 });
  const body = [
    "Universidad Francisco Marroquín · MiU (demo)",
    `Recibo ${r.numero}`,
    `Concepto: ${r.concepto}`,
    `Método: ${r.detalleMetodo}`,
    `Fecha: ${r.fecha}`,
    `Monto: ${quetzales(r.monto)}`,
    `Comisión: ${quetzales(r.comision)}`,
    `Total pagado: ${quetzales(r.total)}`,
    "",
    "Documento de demostración: no es un comprobante fiscal.",
  ].join("\n");
  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="recibo-${r.numero}.txt"`,
      "cache-control": "private, no-store",
    },
  });
}
