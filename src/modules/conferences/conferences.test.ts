import { describe, expect, it } from "vitest";

import { at } from "@/mock/seed";
import { maestro, student, value } from "@/test/actors";

import { MockConferences } from "./adapters/mock/mock-conferences";
import { createRealConferences } from "./adapters/real/real-conferences";
import { reserveOutcome, statusOf } from "./domain/rules";

const now = new Date(at(0, "07:42"));
const fresh = () => new MockConferences(undefined, () => now);

describe("conference states", () => {
  const future = { fecha: at(2, "18:00"), cupo: 10, inscritos: 5 };
  const past = { fecha: at(-3, "18:00"), cupo: 10, inscritos: 5 };
  it("before the talk: available, full, reserved or waiting", () => {
    expect(statusOf(future, undefined, now)).toBe("disponible");
    expect(statusOf({ ...future, inscritos: 10 }, undefined, now)).toBe("llena");
    expect(statusOf(future, { estado: "reservada" }, now)).toBe("reservada");
    expect(statusOf(future, { estado: "en_espera" }, now)).toBe("en_espera");
  });
  it("after: to evaluate within 7 days, evaluated, or expired", () => {
    expect(statusOf(past, { estado: "reservada", asistio: true }, now)).toBe("por_evaluar");
    expect(
      statusOf({ ...past, fecha: at(-9, "18:00") }, { estado: "reservada", asistio: true }, now),
    ).toBe("expirada");
    expect(statusOf(past, { estado: "reservada", asistio: false }, now)).toBe("expirada");
    expect(statusOf(past, { estado: "reservada", asistio: true, evaluacion: {} }, now)).toBe(
      "evaluada",
    );
    expect(statusOf(past, undefined, now)).toBe("pasada");
  });
  it("a full talk puts you on the waiting list", () => {
    expect(reserveOutcome({ cupo: 10, inscritos: 9 }, 0)).toEqual({ estado: "reservada" });
    expect(reserveOutcome({ cupo: 10, inscritos: 10 }, 3)).toEqual({
      estado: "en_espera",
      posicion: 4,
    });
  });
});

describe("ConferencePort (mock)", () => {
  it("reserve, wait, cancel and evaluate, per user", async () => {
    const port = fresh();
    const ana = student();
    expect(value(await port.reserve(ana, "conocimiento-disperso"))).toMatchObject({
      estado: "reservada",
      inscritos: 88,
    });
    expect(value(await port.reserve(ana, "etica-ia"))).toMatchObject({
      estado: "en_espera",
      posicion: 4,
    });
    expect(value(await port.cancel(ana, "etica-ia")).estado).toBe("llena");
    expect(value(await port.get(student(), "conocimiento-disperso")).estado).toBe("disponible");
    expect(await port.submitEvaluation(ana, "historia-moneda", { calificacion: 9 })).toMatchObject({
      error: "invalid",
    });
    expect(
      value(
        await port.submitEvaluation(ana, "historia-moneda", {
          calificacion: 4,
          comentario: "Buena",
        }),
      ).estado,
    ).toBe("evaluada");
    expect(await port.submitEvaluation(ana, "historia-moneda", { calificacion: 4 })).toMatchObject({
      error: "invalid",
    });
    const mine = value(await port.listMine(ana)).map((c) => [c.id, c.estado]);
    expect(mine).toContainEqual(["derecho-libertad", "expirada"]);
    expect(await port.search(maestro())).toMatchObject({ error: "forbidden" });
    expect(await createRealConferences().search(ana)).toMatchObject({ error: "unavailable" });
  });
});
