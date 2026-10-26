import { academicNow } from "@/lib/clock";
import { academic } from "@/modules/academic";
import { assessment } from "@/modules/assessment";
import { ledger } from "@/modules/finance";
import type { Actor } from "@/modules/identity";

import { buildCommandIndex, type IndexData } from "./command-index";

const value = <T>(r: { ok: true; value: T } | { ok: false }) => (r.ok ? r.value : undefined);

/** Fetches what the actor's ⌘K index needs, in parallel, from the ports. */
export async function loadCommands(actor: Actor) {
  const d: IndexData = {};
  if (actor.role === "estudiante") {
    const [courses, activities, charges, people, schedule] = await Promise.all([
      academic().listCurrentEnrollments(actor),
      assessment().listActivities(actor),
      ledger().listCharges(actor),
      academic().listCoursePeople(actor),
      academic().getSchedule(actor),
    ]);
    Object.assign(d, {
      courses: value(courses),
      activities: value(activities),
      charges: value(charges),
      people: value(people),
      schedule: value(schedule),
    });
  } else if (actor.role === "administrativo") {
    d.transfers = value(await ledger().listTransferQueue(actor));
  } else {
    const [sections, queue] = await Promise.all([
      academic().listTeachingSections(actor),
      assessment().listGradingQueue(actor),
    ]);
    d.sections = value(sections);
    d.queue = value(queue);
    const rosters = await Promise.all(
      (d.sections ?? []).map(async (s) =>
        (value(await academic().getRoster(actor, s.sectionId)) ?? []).map((r) => ({
          ...r,
          sectionId: s.sectionId,
          curso: `${s.corto} ${s.seccion}`,
        })),
      ),
    );
    d.roster = rosters.flat();
  }
  return buildCommandIndex(
    actor.role,
    Object.fromEntries(Object.entries(d).filter(([, v]) => v)) as IndexData,
    academicNow(),
  );
}
