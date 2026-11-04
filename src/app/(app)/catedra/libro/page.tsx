import { notFound, redirect } from "next/navigation";

import { requirePermission } from "@/authz/server";
import { route } from "@/features/shared/format";
import { academic } from "@/modules/academic";
import { requireActor } from "@/modules/identity/session";

/** The gradebook opens on the actor's first section; the tabs there switch to the others. */
export default async function LibroIndex() {
  await requirePermission("grade");
  const sections = await academic().listTeachingSections(await requireActor());
  const first = sections.ok ? sections.value[0] : undefined;
  if (!first) notFound();
  redirect(route(`/catedra/libro/${first.sectionId}`));
}
