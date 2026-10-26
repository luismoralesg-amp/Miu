import { scheduleIcs } from "@/features/horario/week";
import { academicNow } from "@/lib/clock";
import { academic } from "@/modules/academic";
import { assessment } from "@/modules/assessment";
import { actorFor } from "@/modules/identity/actor";
import { currentUser } from "@/modules/identity/session";

/** The term's schedule as an .ics file: weekly classes until the term ends, plus upcoming exams. */
export async function GET() {
  const user = await currentUser();
  if (!user) return new Response("Inicia sesión.", { status: 401 });
  const actor = actorFor(user.user, user.rol);
  const [term, schedule, acts] = await Promise.all([
    academic().getTerm(),
    academic().getSchedule(actor),
    assessment().listActivities(actor),
  ]);
  if (!term.ok || !schedule.ok) return new Response("No disponible", { status: 503 });
  const ics = scheduleIcs(schedule.value, term.value, acts.ok ? acts.value : [], academicNow());
  return new Response(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": 'attachment; filename="horario-miu.ics"',
      "cache-control": "private, no-store",
    },
  });
}
