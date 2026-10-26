import { describe, expect, it } from "vitest";

import { at } from "@/mock/seed";
import { admin, student, value } from "@/test/actors";

import { MockLedger } from "./adapters/mock/mock-ledger";
import { createRealLedger } from "./adapters/real/real-ledger";
import { isSolventFrom, runningStatement } from "./domain/rules";

const fresh = (now = new Date(at(0, "07:42"))) => new MockLedger(undefined, () => now);

describe("ledger rules", () => {
  it("running statement adds charges and subtracts payments by date", () => {
    const lines = runningStatement([
      { fecha: "2026-09-01", concepto: "Pago", cargo: null, abono: 100 },
      { fecha: "2026-08-01", concepto: "Cargo", cargo: 150.5, abono: null },
    ]);
    expect(lines.map((l) => l.saldo)).toEqual([150.5, 50.5]);
  });

  it("solvent unless something pending is overdue", () => {
    expect(isSolventFrom([{ estado: "pendiente", diasParaVencer: 6 }])).toBe(true);
    expect(isSolventFrom([{ estado: "en_revision", diasParaVencer: -3 }])).toBe(true);
    expect(isSolventFrom([{ estado: "pendiente", diasParaVencer: -1 }])).toBe(false);
  });
});

describe("LedgerPort (mock)", () => {
  it("getBalance: Q7,387.80 due Wednesday 28, solvent", async () => {
    const b = value(await fresh().getBalance(student()));
    expect(b).toMatchObject({ saldo: 7387.8, pendientes: 1, solvente: true });
    expect(b.proximo).toMatchObject({
      id: "cuota-noviembre",
      vence: "2026-10-28",
      diasParaVencer: 6,
    });
  });

  it("listCharges: what is owed and what is in review, never what is paid", async () => {
    const list = value(await fresh().listCharges(student()));
    expect(list.map((c) => [c.id, c.estado])).toEqual([
      ["multa-biblioteca", "en_revision"],
      ["cuota-noviembre", "pendiente"],
    ]);
    expect(value(await fresh().getCharge(student(), "cuota-noviembre")).desglose).toHaveLength(3);
    expect(await fresh().getCharge(student(), "nada")).toMatchObject({ error: "not_found" });
    expect(await fresh().listCharges(admin())).toMatchObject({ error: "forbidden" });
  });

  it("listReceipts: newest first with the card fee shown", async () => {
    const r = value(await fresh().listReceipts(student()));
    expect(r.map((x) => x.estado)).toEqual(["revision", "pagado", "pagado", "pagado"]);
    expect(r.find((x) => x.metodo === "tarjeta")).toMatchObject({
      comision: 334.45,
      total: 7722.25,
    });
  });

  it("getStatement: range with the balance carried in", async () => {
    const s = value(
      await fresh().getStatement(student(), { desde: "2026-09-01", hasta: "2026-10-22" }),
    );
    expect(s.saldoInicial).toBe(7387.8);
    expect(s.movimientos.map((m) => m.concepto)).toEqual([
      "Pago: Cuota de octubre (Transferencia ACH)",
      "Cuota de noviembre",
      "Multa de biblioteca",
    ]);
    expect(s.saldoFinal).toBe(7432.8);
    expect(
      await fresh().getStatement(student(), { desde: "2026-10-22", hasta: "2026-09-01" }),
    ).toMatchObject({
      error: "invalid",
    });
  });

  it("transfer with receipt: in review for the student, in the queue for the Administrativo", async () => {
    const port = fresh();
    const ana = student();
    const receipt = value(
      await port.submitTransfer(ana, {
        chargeId: "cuota-noviembre",
        banco: "Banco Industrial",
        boleta: "998877",
        archivo: "boleta.pdf",
      }),
    );
    expect(receipt.estado).toBe("revision");
    expect(value(await port.getBalance(ana)).saldo).toBe(0);
    expect(value(await port.getBalance(student())).saldo).toBe(7387.8);
    const rodrigo = admin();
    const queue = value(await port.listTransferQueue(rodrigo));
    const mine = queue.find((t) => t.boleta === "998877")!;
    expect(queue.filter((t) => t.estado === "pendiente")).toHaveLength(5);
    expect(await port.reviewTransfer(rodrigo, mine.id, { aprobar: false })).toMatchObject({
      error: "invalid",
    });
    expect(value(await port.reviewTransfer(rodrigo, mine.id, { aprobar: true })).estado).toBe(
      "aprobada",
    );
    expect(value(await port.listReceipts(ana)).find((r) => r.id === receipt.id)!.estado).toBe(
      "pagado",
    );
    expect(await port.reviewTransfer(rodrigo, mine.id, { aprobar: true })).toMatchObject({
      error: "invalid",
    });
    expect(await port.listTransferQueue(ana)).toMatchObject({ error: "forbidden" });
  });

  it("isSolvent: falls when a charge is overdue", async () => {
    expect(value(await fresh().isSolvent(student())).solvente).toBe(true);
    const later = fresh(new Date(at(8, "09:00")));
    expect(value(await later.isSolvent(student()))).toMatchObject({
      solvente: false,
      motivo: "Cuota de noviembre vencida",
    });
  });

  it("the real adapter answers unavailable", async () => {
    expect(await createRealLedger().getBalance(student())).toMatchObject({ error: "unavailable" });
  });
});
