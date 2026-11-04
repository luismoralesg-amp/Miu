import type { Batch, SectionGradebook, TeachingActivityStatus } from "@/modules/assessment";

/** What the review screen needs to know about one activity of a section, ready to render. */
export type PublishItem = {
  sectionId: string;
  activityId: string;
  titulo: string;
  estado: TeachingActivityStatus;
  cerrada: boolean;
  enLote: boolean;
  umbral: number;
  /** Saved and not yet published. */
  guardadas: number;
  publicadas: number;
  /** Students with no saved grade yet. */
  sinNota: number;
  /** Mean of the saved-but-unpublished grades. */
  promedio: number | null;
  promedioTotal: number | null;
  bajo: Array<{ nombre: string; nota: number; justificacion: string }>;
};

/** Combines the section's gradebook with the batch of each activity that has something to publish. */
export function publishItems(book: SectionGradebook, batches: Map<string, Batch>): PublishItem[] {
  const total = book.estudiantes.length;
  return book.actividades
    .filter((a) => a.enLote)
    .map((a) => {
      const pending = (batches.get(a.id)?.entradas ?? []).filter(
        (e) => e.estado === "guardada" && e.nota !== null,
      );
      const notas = pending.map((e) => e.nota as number);
      return {
        sectionId: book.sectionId,
        activityId: a.id,
        titulo: a.titulo,
        estado: a.estado,
        cerrada: book.cerrada,
        enLote: a.enLote,
        umbral: book.umbral,
        guardadas: a.calificadas - a.publicadas,
        publicadas: a.publicadas,
        sinNota: total - a.calificadas,
        promedio: notas.length
          ? Math.round((notas.reduce((s, n) => s + n, 0) / notas.length) * 10) / 10
          : null,
        promedioTotal: a.promedio,
        bajo: pending
          .filter((e) => (e.nota as number) < book.umbral)
          .map((e) => ({
            nombre: e.nombre,
            nota: e.nota as number,
            justificacion: e.justificacion ?? "Sin justificación",
          })),
      };
    })
    .sort(
      (a, b) =>
        Number(b.guardadas > 0) - Number(a.guardadas > 0) ||
        Number(a.estado === "publicada") - Number(b.estado === "publicada"),
    );
}
