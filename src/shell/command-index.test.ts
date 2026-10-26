import { describe, expect, it } from "vitest";

import { at } from "@/mock/seed";
import { MockAcademic } from "@/modules/academic/adapters/mock/mock-academic";
import { MockAssessment } from "@/modules/assessment/adapters/mock/mock-assessment";
import { MockLedger } from "@/modules/finance/adapters/mock/mock-ledger";
import { admin, auxiliar, student, value } from "@/test/actors";

import { buildCommandIndex } from "./command-index";
import { filterCommands } from "./commands";

const now = new Date(at(0, "07:42"));

async function studentIndex() {
  const ana = student();
  const acad = new MockAcademic();
  return buildCommandIndex(
    "estudiante",
    {
      courses: value(await acad.listCurrentEnrollments(ana)),
      activities: value(await new MockAssessment(undefined, () => now).listActivities(ana)),
      charges: value(await new MockLedger(undefined, () => now).listCharges(ana)),
      people: value(await acad.listCoursePeople(ana)),
      schedule: value(await acad.getSchedule(ana)),
    },
    now,
  );
}

describe("⌘K index by role", () => {
  it("a student finds courses, activities, charges and teachers, all pointing at real screens", async () => {
    const idx = await studentIndex();
    expect(filterCommands(idx, "discreta").find((i) => i.grupo === "Cursos")?.href).toBe(
      "/cursos/matematica-discreta",
    );
    expect(filterCommands(idx, "llaves").find((i) => i.grupo === "Actividades")?.href).toBe(
      "/cursos/paradigmas-de-programacion/actividades/pp-ejercicio-llaves",
    );
    expect(filterCommands(idx, "noviembre").find((i) => i.grupo === "Pagos")?.href).toBe(
      "/pagos/pagar/cuota-noviembre",
    );
    expect(filterCommands(idx, "pagar")[0]).toMatchObject({
      id: "a-pagar",
      href: "/pagos/pagar/cuota-noviembre",
    });
    expect(filterCommands(idx, "herrera").find((i) => i.grupo === "Personas")?.href).toBe(
      "/comunicacion?con=p-lucia",
    );
    expect(idx.some((i) => i.href.startsWith("/catedra") || i.href.startsWith("/admin"))).toBe(
      false,
    );
  });

  it("an Auxiliar finds only their sections, queue and students", async () => {
    const carlos = auxiliar();
    const acad = new MockAcademic();
    const sections = value(await acad.listTeachingSections(carlos));
    const roster = (
      await Promise.all(
        sections.map(async (s) =>
          value(await acad.getRoster(carlos, s.sectionId)).map((r) => ({
            ...r,
            sectionId: s.sectionId,
            curso: s.corto,
          })),
        ),
      )
    ).flat();
    const idx = buildCommandIndex(
      "auxiliar",
      {
        sections,
        queue: value(await new MockAssessment(undefined, () => now).listGradingQueue(carlos)),
        roster,
      },
      now,
    );
    expect(filterCommands(idx, "closures")[0]!.href).toBe(
      "/catedra/por-calificar?seccion=pp-a&actividad=pp-actividad-6",
    );
    expect(idx.filter((i) => i.grupo === "Cursos").map((i) => i.href)).toEqual([
      "/catedra/secciones/md-b",
      "/catedra/secciones/pp-a",
    ]);
    expect(idx.some((i) => i.href.includes("md-a"))).toBe(false);
    expect(idx.some((i) => i.href.startsWith("/pagos"))).toBe(false);
    expect(filterCommands(idx, "estrada").find((i) => i.grupo === "Personas")?.detalle).toMatch(
      /••/,
    );
  });

  it("the Administrativo finds the transfer queue and nothing academic", async () => {
    const idx = buildCommandIndex(
      "administrativo",
      { transfers: value(await new MockLedger().listTransferQueue(admin())) },
      now,
    );
    expect(filterCommands(idx, "chavez").find((i) => i.grupo === "Pagos")?.href).toBe(
      "/admin/pagos?transferencia=tr-2",
    );
    expect(idx.some((i) => i.grupo === "Cursos" || i.grupo === "Actividades")).toBe(false);
  });
});
