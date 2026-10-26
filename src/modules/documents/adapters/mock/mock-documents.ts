import { z } from "zod";

import { academicNow } from "@/lib/clock";
import { parsed } from "@/lib/contract";
import { fail } from "@/lib/result";
import { at } from "@/mock/seed";
import type { Actor } from "@/modules/identity";

import { AcademicDocument, DocumentKind, kindLabel } from "../../domain/types";
import type { DocumentsPort } from "../../ports/documents-port";

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const SEED: z.infer<typeof AcademicDocument>[] = [
  {
    id: "doc-1",
    tipo: "constancia_inscripcion",
    titulo: "Constancia de inscripción 2026-2",
    fecha: at(-75, "10:12"),
    estado: "listo",
    verificacion: "UFM-7Q2K-91",
  },
  {
    id: "doc-2",
    tipo: "certificacion_notas",
    titulo: "Certificación de notas 2026-1",
    fecha: at(-60, "15:40"),
    estado: "listo",
    verificacion: "UFM-3D8M-04",
  },
  {
    id: "doc-3",
    tipo: "constancia_solvencia",
    titulo: "Constancia de solvencia, septiembre",
    fecha: at(-30, "09:05"),
    estado: "listo",
    verificacion: "UFM-5H1P-77",
  },
  {
    id: "doc-4",
    tipo: "certificacion_notas",
    titulo: "Certificación de notas 2025-2",
    fecha: at(-250, "11:30"),
    estado: "listo",
    verificacion: "UFM-2A6T-18",
  },
];

/** Seed documents plus what each user requests. Requests take a day to be ready [S]. */
export class MockDocuments implements DocumentsPort {
  private readonly requested = new Map<string, z.infer<typeof AcademicDocument>[]>();

  constructor(private readonly now: () => Date = academicNow) {}

  async listAcademicDocuments(actor: Actor, filter: { desde: string; hasta: string; q?: string }) {
    if (actor.role !== "estudiante") return fail("forbidden");
    if (filter.desde > filter.hasta)
      return fail("invalid", "La fecha inicial es posterior a la final");
    const words = fold(filter.q ?? "")
      .split(/\s+/)
      .filter(Boolean);
    const list = [...(this.requested.get(actor.userId) ?? []), ...SEED]
      .filter((d) => d.fecha.slice(0, 10) >= filter.desde && d.fecha.slice(0, 10) <= filter.hasta)
      .filter((d) =>
        words.every((w) => fold(`${d.titulo} ${kindLabel[d.tipo]} ${d.verificacion}`).includes(w)),
      )
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
    return parsed(z.array(AcademicDocument), list);
  }

  async requestDocument(actor: Actor, tipo: z.infer<typeof DocumentKind>) {
    if (actor.role !== "estudiante") return fail("forbidden");
    const k = DocumentKind.safeParse(tipo);
    if (!k.success) return fail("invalid", "Tipo de documento desconocido");
    const mine = this.requested.get(actor.userId) ?? [];
    const doc = {
      id: `sol-${mine.length + 1}`,
      tipo: k.data,
      titulo: kindLabel[k.data],
      fecha: this.now().toISOString(),
      estado: "en_proceso" as const,
      verificacion: "Pendiente",
    };
    this.requested.set(actor.userId, [doc, ...mine]);
    return parsed(AcademicDocument, doc);
  }
}
