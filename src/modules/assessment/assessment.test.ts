import { describe, expect, it } from "vitest";

import { at } from "@/mock/seed";
import { admin, auxiliar, maestro, student, value } from "@/test/actors";

import { MockAssessment } from "./adapters/mock/mock-assessment";
import { createRealAssessment } from "./adapters/real/real-assessment";
import {
  closeReadiness,
  currentGrade,
  hasJustification,
  needsJustification,
  neededFor,
  projectedFinal,
  termAverage,
  weighted,
} from "./domain/rules";

const HASH = "a".repeat(64);
const fresh = (now = new Date(at(0, "07:42"))) => new MockAssessment(undefined, () => now);

describe("grading rules", () => {
  it("the final grade closes when nothing is left to grade or publish", () => {
    const a = (estado: "programada" | "por_calificar" | "sin_publicar" | "publicada") => ({
      titulo: estado,
      estado,
    });
    expect(closeReadiness([a("publicada"), a("programada")])).toMatchObject({
      listo: true,
      bloqueos: [],
      programadas: [{ titulo: "programada" }],
    });
    expect(closeReadiness([a("publicada"), a("sin_publicar"), a("por_calificar")])).toMatchObject({
      listo: false,
    });
    expect(closeReadiness([a("sin_publicar")]).bloqueos).toHaveLength(1);
    expect(closeReadiness([])).toMatchObject({ listo: true });
  });

  it("weights and current grade (Discreta: 46.6 over 60 → 77.7)", () => {
    const { evaluado, obtenido } = weighted([
      { peso: 10, nota: 78 },
      { peso: 15, nota: 80 },
      { peso: 20, nota: 72 },
      { peso: 10, nota: 79 },
      { peso: 5, nota: 90 },
    ]);
    expect([evaluado, obtenido]).toEqual([60, 46.6]);
    expect(currentGrade(evaluado, obtenido)).toBe(77.7);
    expect(currentGrade(0, 0)).toBe(0);
  });

  it("term average is the plain mean of the course grades", () => {
    expect(termAverage([77.7, 91, 87, 84])).toBe(84.9);
    expect(termAverage([])).toBe(0);
  });

  it("what is needed for each target", () => {
    expect(neededFor(71, 60, 46.6)).toBe(61);
    expect(neededFor(80, 60, 46.6)).toBe(84);
    expect(neededFor(90, 60, 46.6)).toBe(109);
    expect(neededFor(71, 60, 80)).toBe(0);
    expect(neededFor(71, 100, 60)).toBe(Infinity);
    expect(projectedFinal(60, 46.6, 75)).toBe(77);
  });

  it("justification only under the threshold, and it must say something", () => {
    expect(needsJustification(60, 61)).toBe(true);
    expect(needsJustification(61, 61)).toBe(false);
    expect(hasJustification("  corto ")).toBe(false);
    expect(hasJustification("Sin pruebas y no compila.")).toBe(true);
  });
});

describe("AssessmentPort (mock) · student", () => {
  it("listActivities: status per activity", async () => {
    const list = value(await fresh().listActivities(student()));
    const status = Object.fromEntries(list.map((a) => [a.id, a.estado]));
    expect(status).toMatchObject({
      "md-quiz-3": "calificada",
      "pp-actividad-6": "entregada",
      "pp-ejercicio-llaves": "pendiente",
      "md-parcial-2": "programada",
      "el-control-lectura": "calificada",
    });
    expect(list.every((a, i) => i === 0 || list[i - 1]!.fecha <= a.fecha)).toBe(true);
    expect(value(await fresh().listActivities(maestro()))).toEqual([]);
  });

  it("getActivity: rubric before submitting; not_found and forbidden", async () => {
    const a = value(await fresh().getActivity(student(), "pp-ejercicio-llaves"));
    expect(a.rubrica.map((r) => r.criterio)).toEqual([
      "Correctitud",
      "Pruebas",
      "Estilo y claridad",
    ]);
    expect(await fresh().getActivity(student(), "nada")).toMatchObject({ error: "not_found" });
    expect(await fresh().getActivity(maestro(), "pp-ejercicio-llaves")).toMatchObject({
      error: "forbidden",
    });
  });

  it("submit: returns a receipt and only that session sees it", async () => {
    const port = fresh();
    const ana = student();
    const other = student();
    const receipt = value(
      await port.submit(ana, "pp-ejercicio-llaves", {
        archivo: "llaves.zip",
        tamanoBytes: 2048,
        hash: HASH,
      }),
    );
    expect(receipt).toMatchObject({ recibo: "MIU-E-AAAAAAAA", hash: HASH, atrasada: false });
    expect(value(await port.getActivity(ana, "pp-ejercicio-llaves")).estado).toBe("entregada");
    expect(value(await port.getActivity(other, "pp-ejercicio-llaves")).estado).toBe("pendiente");
  });

  it("submit: rejects a bad hash, a closed deadline and in-person work", async () => {
    const input = { archivo: "x.zip", tamanoBytes: 10, hash: HASH };
    expect(
      await fresh().submit(student(), "pp-ejercicio-llaves", { ...input, hash: "123" }),
    ).toMatchObject({
      error: "invalid",
    });
    const late = fresh(new Date(at(2, "09:00")));
    expect(await late.submit(student(), "pp-ejercicio-llaves", input)).toMatchObject({
      error: "invalid",
      detail: "La fecha límite ya pasó",
    });
    expect(await fresh().submit(student(), "md-parcial-2", input)).toMatchObject({
      error: "invalid",
    });
    expect(await fresh().submit(maestro(), "pp-ejercicio-llaves", input)).toMatchObject({
      error: "forbidden",
    });
  });

  it("getGradebook: the ronda 3 averages and history", async () => {
    const book = value(await fresh().getGradebook(student()));
    expect(book.cursos.map((c) => [c.curso.corto, c.evaluado, c.actual])).toEqual([
      ["Discreta", 60, 77.7],
      ["Paradigmas", 55, 91],
      ["Ética", 50, 87],
      ["Bases de Datos", 45, 84],
    ]);
    expect(book.promedio).toBe(84.9);
    expect(book.historial.at(-1)).toEqual({ periodo: "2026-1", promedio: 83.8 });
    expect(book.metas).toEqual([71, 80, 90]);
    expect(book.cursos[1]!.nuevas).toBe(1);
  });

  it("createAppeal: only over a published grade, with a real reason", async () => {
    const port = fresh();
    const ana = student();
    expect(
      await port.createAppeal(ana, { activityId: "md-quiz-3", motivo: "corto" }),
    ).toMatchObject({
      error: "invalid",
    });
    expect(
      await port.createAppeal(ana, {
        activityId: "pp-ejercicio-llaves",
        motivo: "Quiero que revisen esta actividad por favor.",
      }),
    ).toMatchObject({ error: "invalid" });
    const ap = value(
      await port.createAppeal(ana, {
        activityId: "md-quiz-3",
        motivo: "En la pregunta 4 mi demostración es correcta por contrapositiva.",
      }),
    );
    expect(ap).toMatchObject({ estado: "nueva", nota: 90 });
    expect(value(await port.listAppeals(ana)).map((a) => a.id)).toEqual([ap.id]);
  });
});

describe("AssessmentPort (mock) · teaching", () => {
  it("listGradingQueue: each role sees its own sections", async () => {
    const carlos = value(await fresh().listGradingQueue(auxiliar()));
    expect(carlos.map((q) => [q.sectionId, q.activityId, q.entregadas, q.calificadas])).toEqual([
      ["md-b", "md-tarea-4", 22, 0],
      ["pp-a", "pp-actividad-6", 24, 4],
    ]);
    const jorge = value(await fresh().listGradingQueue(maestro()));
    expect(jorge.map((q) => q.sectionId)).toEqual(["md-a", "md-b"]);
    expect(value(await fresh().listGradingQueue(student()))).toEqual([]);
  });

  it("listBatch: the whole section with masked carnés", async () => {
    const batch = value(await fresh().listBatch(auxiliar(), "pp-a", "pp-actividad-6"));
    expect(batch.entradas).toHaveLength(24);
    expect(batch.umbral).toBe(61);
    expect(batch.entradas.find((e) => e.nombre === "Daniel Estrada")).toMatchObject({
      nota: 55,
      justificacion: "Sin pruebas y dos funciones no compilan.",
    });
    expect(batch.entradas.find((e) => e.nombre === "Gabriela Hernández")!.atrasada).toBe(true);
  });

  it("getSectionGradebook: every student against every activity, only in one's own sections", async () => {
    const port = fresh();
    const jorge = maestro();
    const book = value(await port.getSectionGradebook(jorge, "md-a"));
    expect(book.estudiantes).toHaveLength(28);
    expect(book.estudiantes.every((e) => e.carne.includes("••"))).toBe(true);
    // The demo student's row matches what she sees in Notas.
    expect(book.estudiantes.find((e) => e.studentId === "p-ana")).toMatchObject({
      evaluado: 60,
      actual: 77.7,
    });
    const estado = Object.fromEntries(book.actividades.map((a) => [a.id, a.estado]));
    expect(estado).toMatchObject({
      "md-quiz-3": "publicada",
      "md-tarea-4": "por_calificar",
      "md-parcial-2": "programada",
    });
    expect(book.actividades.find((a) => a.id === "md-tarea-4")).toMatchObject({
      calificadas: 0,
      enLote: true,
      promedio: null,
    });
    expect(book.bajoUmbral).toBe(book.estudiantes.filter((e) => e.actual < 61).length);

    // A saved grade shows up at once, still unpublished.
    await port.gradeSubmission(jorge, {
      sectionId: "md-a",
      activityId: "md-tarea-4",
      studentId: "p-ana",
      nota: 88,
    });
    const after = value(await port.getSectionGradebook(jorge, "md-a"));
    expect(after.actividades.find((a) => a.id === "md-tarea-4")).toMatchObject({
      calificadas: 1,
      publicadas: 0,
      promedio: 88,
    });
    expect(after.estudiantes.find((e) => e.studentId === "p-ana")!.notas["md-tarea-4"]).toBe(88);

    expect(await port.getSectionGradebook(auxiliar(), "md-a")).toMatchObject({
      error: "forbidden",
    });
    expect(await port.getSectionGradebook(student(), "md-a")).toMatchObject({ error: "forbidden" });
    expect(value(await port.getSectionGradebook(auxiliar(), "md-b")).estudiantes).toHaveLength(22);
  });

  it("appeals show the same grade as the gradebook", async () => {
    const port = fresh();
    const jorge = maestro();
    const [ap] = value(await port.listAppeals(jorge));
    const book = value(await port.getSectionGradebook(jorge, ap!.sectionId));
    const row = book.estudiantes.find((e) => e.studentId === ap!.estudiante.id)!;
    expect(ap!.nota).toBe(row.notas[ap!.activityId]);
  });

  it("gradeSubmission: justification required under 61; other sections are forbidden", async () => {
    const port = fresh();
    const carlos = auxiliar();
    const base = { sectionId: "pp-a", activityId: "pp-actividad-6", studentId: "p-s004" };
    expect(await port.gradeSubmission(carlos, { ...base, nota: 50 })).toMatchObject({
      error: "invalid",
      detail: "Bajo 61 la justificación es obligatoria",
    });
    expect(
      value(
        await port.gradeSubmission(carlos, {
          ...base,
          nota: 50,
          justificacion: "No implementa el contador.",
        }),
      ),
    ).toMatchObject({ estado: "guardada", nota: 50 });
    expect(value(await port.gradeSubmission(carlos, { ...base, nota: 85 }))).not.toHaveProperty(
      "justificacion",
    );
    expect(await port.gradeSubmission(auxiliar("p-sofia"), { ...base, nota: 85 })).toMatchObject({
      error: "forbidden",
    });
    expect(await port.gradeSubmission(carlos, { ...base, nota: 101 })).toMatchObject({
      error: "invalid",
    });
  });

  it("publishGrades: publishes every saved grade once", async () => {
    const port = fresh();
    const carlos = auxiliar();
    await port.gradeSubmission(carlos, {
      sectionId: "pp-a",
      activityId: "pp-actividad-6",
      studentId: "p-s004",
      nota: 90,
    });
    expect(value(await port.publishGrades(carlos, "pp-a", "pp-actividad-6"))).toEqual({
      publicadas: 5,
    });
    expect(value(await port.publishGrades(carlos, "pp-a", "pp-actividad-6"))).toEqual({
      publicadas: 0,
    });
  });

  /** Grades every pending activity of a section and publishes it, so the final grade can close. */
  async function gradeEverything(port: MockAssessment, jorge: ReturnType<typeof maestro>) {
    const queue = value(await port.listGradingQueue(jorge)).filter((q) => q.sectionId === "md-b");
    for (const q of queue) {
      const batch = value(await port.listBatch(jorge, "md-b", q.activityId));
      for (const e of batch.entradas)
        value(
          await port.gradeSubmission(jorge, {
            sectionId: "md-b",
            activityId: q.activityId,
            studentId: e.studentId,
            nota: 80,
          }),
        );
      value(await port.publishGrades(jorge, "md-b", q.activityId));
    }
  }

  it("closeFinalGrade: only the Maestro, only with nothing left to grade, once", async () => {
    const port = fresh();
    const jorge = maestro();
    expect(await port.closeFinalGrade(auxiliar(), "md-b")).toMatchObject({ error: "forbidden" });
    // Tarea 4 is still waiting for grades: the final grade can't close yet.
    expect(await port.closeFinalGrade(jorge, "md-b")).toMatchObject({
      error: "invalid",
      detail: "Aún hay actividades por calificar o publicar",
    });
    await gradeEverything(port, jorge);
    expect(value(await port.closeFinalGrade(jorge, "md-b"))).toMatchObject({ cerrada: true });
    expect(value(await port.isClosed(jorge, "md-b"))).toBe(true);
    expect(value(await port.getSectionGradebook(jorge, "md-b")).cerrada).toBe(true);
    expect(await port.closeFinalGrade(jorge, "md-b")).toMatchObject({ error: "invalid" });
  });

  it("after the close, grading and publishing both stop", async () => {
    const port = fresh();
    const jorge = maestro();
    await gradeEverything(port, jorge);
    value(await port.closeFinalGrade(jorge, "md-b"));
    expect(
      await port.gradeSubmission(jorge, {
        sectionId: "md-b",
        activityId: "md-tarea-4",
        studentId: "p-s100",
        nota: 80,
      }),
    ).toMatchObject({ error: "invalid" });
    expect(await port.publishGrades(jorge, "md-b", "md-tarea-4")).toMatchObject({
      error: "invalid",
    });
  });

  it("listAppeals: by section for teachers, escalated ones for the Administrativo", async () => {
    expect(value(await fresh().listAppeals(maestro())).map((a) => a.id)).toEqual(["ap-1"]);
    expect(value(await fresh().listAppeals(auxiliar())).map((a) => a.id)).toEqual(["ap-2"]);
    expect(value(await fresh().listAppeals(admin())).map((a) => a.estado)).toEqual(["escalada"]);
  });

  it("replyAppeal: the team answers or escalates; the answer is kept", async () => {
    const port = fresh();
    const jorge = maestro();
    expect(await port.replyAppeal(jorge, "ap-1", { respuesta: "corto" })).toMatchObject({
      error: "invalid",
    });
    // Carlos assists pp-a, not md-a.
    expect(
      await port.replyAppeal(auxiliar(), "ap-1", { respuesta: "Revisé la pregunta 4." }),
    ).toMatchObject({ error: "forbidden" });
    const replied = value(
      await port.replyAppeal(jorge, "ap-1", { respuesta: "Revisé la pregunta 4 con la rúbrica." }),
    );
    expect(replied).toMatchObject({ estado: "respondida", respuesta: expect.any(String) });
    const escalated = value(
      await port.replyAppeal(jorge, "ap-1", {
        respuesta: "Lo paso a la administración.",
        escalar: true,
      }),
    );
    expect(escalated.estado).toBe("escalada");
    // Escalated is no longer the team's to answer, and students never reply.
    expect(
      await port.replyAppeal(jorge, "ap-1", { respuesta: "Otra respuesta distinta." }),
    ).toMatchObject({
      error: "invalid",
    });
    expect(
      await port.replyAppeal(student(), "ap-1", { respuesta: "Soy la estudiante." }),
    ).toMatchObject({
      error: "forbidden",
    });
  });

  it("resolveAppeal: the Maestro decides; the Administrativo only what was escalated", async () => {
    const port = fresh();
    const jorge = maestro();
    const rodrigo = admin();
    const keep = { decision: "mantiene", respuesta: "La contrapositiva no aplica aquí." } as const;
    expect(await port.resolveAppeal(auxiliar(), "ap-2", keep)).toMatchObject({
      error: "forbidden",
    });
    // Changing the grade needs the new grade.
    expect(
      await port.resolveAppeal(jorge, "ap-1", { decision: "modifica", respuesta: "Tiene razón." }),
    ).toMatchObject({ error: "invalid", detail: "Indica la nota nueva" });
    // md-a's appeal isn't escalated: not the Administrativo's yet.
    expect(await port.resolveAppeal(rodrigo, "ap-1", keep)).toMatchObject({ error: "forbidden" });
    const changed = value(
      await port.resolveAppeal(jorge, "ap-1", {
        decision: "modifica",
        notaNueva: 90,
        respuesta: "Tiene razón: el razonamiento es válido.",
      }),
    );
    expect(changed).toMatchObject({ estado: "resuelta", nota: 90, resolucion: { notaNueva: 90 } });
    expect(await port.resolveAppeal(jorge, "ap-1", keep)).toMatchObject({ error: "invalid" });
    const done = value(await port.resolveAppeal(rodrigo, "ap-2", keep));
    expect(done.resolucion).toMatchObject({ decision: "mantiene", por: "Rodrigo Ajú" });
    expect(value(await port.listAppeals(rodrigo))).toEqual([]);
  });

  it("the real adapter answers unavailable", async () => {
    expect(await createRealAssessment().getGradebook(student())).toMatchObject({
      error: "unavailable",
    });
  });
});
