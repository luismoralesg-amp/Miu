import { parsed } from "@/lib/contract";
import { fail, type PortResult } from "@/lib/result";
import { AREAS, buildSeed, type Seed } from "@/mock/seed";
import type { Actor } from "@/modules/identity";

import { statusOf } from "../../domain/rules";
import { Pensum } from "../../domain/types";
import type { CurriculumPort } from "../../ports/curriculum-port";

export class MockCurriculum implements CurriculumPort {
  constructor(private readonly seed: Seed = buildSeed()) {}

  async getPensum(actor: Actor): PortResult<Pensum> {
    if (actor.role !== "estudiante") return fail("forbidden");
    const { pensum, pastEnrollments, student } = this.seed;
    const aprobados = new Set(pastEnrollments.filter((e) => e.nota >= 61).map((e) => e.codigo));
    const enCurso = new Set(pensum.filter((c) => c.cursoActual).map((c) => c.codigo));
    const cursos = pensum.map((c) => {
      const past = pastEnrollments.find((e) => e.codigo === c.codigo);
      return {
        ...c,
        areaNombre: AREAS[c.area],
        estado: statusOf(c, aprobados, enCurso),
        ...(past ? { nota: past.nota, periodo: past.periodo } : {}),
      };
    });
    const approved = cursos.filter((c) => c.estado === "aprobado");
    return parsed(Pensum, {
      carrera: student.carrera,
      semestreActual: student.semestre,
      areas: Object.entries(AREAS).map(([id, nombre]) => ({ id, nombre })),
      cursos,
      avance: {
        aprobados: approved.length,
        enCurso: enCurso.size,
        total: cursos.length,
        umaAprobadas: approved.reduce((s, c) => s + c.uma, 0),
        umaTotales: cursos.reduce((s, c) => s + c.uma, 0),
      },
    });
  }
}
