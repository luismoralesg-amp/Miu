import { buildIcs } from "@/lib/ics";
import { assessment } from "@/modules/assessment";
import { actorFor } from "@/modules/identity/actor";
import { currentUser } from "@/modules/identity/session";

/** One activity as a calendar file: the deadline (with a reminder a day before) or the exam. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return new Response("Inicia sesión.", { status: 401 });
  const { id } = await params;
  const result = await assessment().getActivity(actorFor(user.user, user.rol), id);
  if (!result.ok)
    return new Response("No encontrado", { status: result.error === "forbidden" ? 403 : 404 });
  const a = result.value;
  const start = new Date(a.fecha);
  const examen = a.tipo === "examen";
  const end =
    examen && a.fin
      ? new Date(`${a.fecha.slice(0, 10)}T${a.fin}:00-06:00`)
      : new Date(start.getTime() + 30 * 60_000);
  const ics = buildIcs(
    [
      {
        uid: `actividad-${a.id}`,
        start: examen ? start : new Date(start.getTime() - 30 * 60_000),
        end: examen ? end : start,
        titulo: `${examen ? "" : "Entrega: "}${a.titulo} · ${a.curso.nombre}`,
        ...(a.salon ? { lugar: a.salon } : {}),
        descripcion: `${a.formato} · vale ${a.peso}%`,
        aviso: examen ? 60 : 24 * 60,
      },
    ],
    { nombre: a.curso.nombre },
  );
  return new Response(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="${a.id}.ics"`,
      "cache-control": "private, no-store",
    },
  });
}
