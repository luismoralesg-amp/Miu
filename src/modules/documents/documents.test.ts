import { describe, expect, it } from "vitest";

import { at, day } from "@/mock/seed";
import { maestro, student, value } from "@/test/actors";

import { MockDocuments } from "./adapters/mock/mock-documents";
import { createRealDocuments } from "./adapters/real/real-documents";

const port = () => new MockDocuments(() => new Date(at(0, "07:42")));

describe("DocumentsPort (mock)", () => {
  it("filters by the term range and searches without accents", async () => {
    const p = port();
    const term = value(
      await p.listAcademicDocuments(student(), { desde: "2026-08-03", hasta: day(0) }),
    );
    expect(term.map((d) => d.id)).toEqual(["doc-3", "doc-2", "doc-1"]);
    const all = value(
      await p.listAcademicDocuments(student(), {
        desde: "2025-01-01",
        hasta: day(0),
        q: "certificacion",
      }),
    );
    expect(all.map((d) => d.id)).toEqual(["doc-2", "doc-4"]);
    expect(
      await p.listAcademicDocuments(student(), { desde: day(0), hasta: "2025-01-01" }),
    ).toMatchObject({ error: "invalid" });
  });

  it("a request appears in process, only for the student who asked", async () => {
    const p = port();
    const ana = student();
    expect(value(await p.requestDocument(ana, "constancia_solvencia"))).toMatchObject({
      estado: "en_proceso",
    });
    expect(
      value(await p.listAcademicDocuments(ana, { desde: day(0), hasta: day(0) })),
    ).toHaveLength(1);
    expect(
      value(await p.listAcademicDocuments(student(), { desde: day(0), hasta: day(0) })),
    ).toHaveLength(0);
    expect(await p.requestDocument(maestro(), "constancia_solvencia")).toMatchObject({
      error: "forbidden",
    });
    expect(await createRealDocuments().requestDocument(ana, "constancia_solvencia")).toMatchObject({
      error: "unavailable",
    });
  });
});
