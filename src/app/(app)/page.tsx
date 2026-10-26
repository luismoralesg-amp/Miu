import type { Metadata } from "next";

import { AsyncBoundary } from "@/design-system/components";
import { HoySkeleton } from "@/features/hoy/skeleton";
import { AdminHoy, TeachingHoy } from "@/features/hoy/staff-hoy";
import { StudentHoy } from "@/features/hoy/student-hoy";
import { requireActor } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Hoy" };

/** Hoy: what needs you now, by role. Content streams in behind a skeleton of the same shape. */
export default async function HoyPage() {
  const actor = await requireActor();
  return (
    <AsyncBoundary fallback={<HoySkeleton />} label="Cargando tu día…">
      {actor.role === "estudiante" ? (
        <StudentHoy actor={actor} />
      ) : actor.role === "administrativo" ? (
        <AdminHoy actor={actor} />
      ) : (
        <TeachingHoy actor={actor} />
      )}
    </AsyncBoundary>
  );
}
