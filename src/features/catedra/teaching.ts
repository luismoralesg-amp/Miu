import type { Tone } from "@/design-system/components";
import type { TeachingActivity, TeachingActivityStatus } from "@/modules/assessment";

/** How each activity reads for the teaching team, and how loud it should be. */
export const STATUS: Record<TeachingActivityStatus, { label: string; tone: Tone }> = {
  programada: { label: "Programada", tone: "neutral" },
  por_calificar: { label: "Por calificar", tone: "warning" },
  sin_publicar: { label: "Sin publicar", tone: "info" },
  publicada: { label: "Publicada", tone: "success" },
};

/** "12 de 28 con nota", or the scheduled date for what hasn't closed yet. */
export function progressLabel(a: TeachingActivity, estudiantes: number) {
  if (a.estado === "programada") return "Aún no cierra";
  if (a.estado === "publicada") return `${a.publicadas} publicadas`;
  if (a.estado === "sin_publicar") return `${a.calificadas - a.publicadas} sin publicar`;
  return `${a.calificadas} de ${estudiantes} con nota`;
}

/** Activities that already closed and still need someone: grading first, then publishing. */
export function pendingWork(actividades: TeachingActivity[]) {
  return actividades.filter((a) => a.estado === "por_calificar" || a.estado === "sin_publicar");
}
