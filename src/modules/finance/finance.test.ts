import { describe, expect, it } from "vitest";

import { at } from "@/mock/seed";
import { admin, student, value } from "@/test/actors";

import { MockLedger } from "./adapters/mock/mock-ledger";
import { createRealLedger } from "./adapters/real/real-ledger";
import { isSolventFrom, reconcile, runningStatement } from "./domain/rules";

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

describe("reconcile", () => {
  const row = (referencia: string, total: number) => ({ referencia, total, fecha: "2026-10-01" });

  it("splits matched, different, only in MiU and only at the provider", () => {
    const r = reconcile(
      [row("a", 100), row("b", 200), row("c", 300)],
      [row("a", 100), row("b", 199.99), row("d", 50)],
    );
    expect(r.conciliados.map((x) => x.miu.referencia)).toEqual(["a"]);
    expect(r.diferencias.map((x) => x.miu.referencia)).toEqual(["b"]);
    expect(r.soloMiu.map((x) => x.referencia)).toEqual(["c"]);
    expect(r.soloProveedor.map((x) => x.referencia)).toEqual(["d"]);
  });

  it("compares to the cent", () => {
    const r = reconcile([row("a", 0.1 + 0.2)], [row("a", 0.3)]);
    expect(r.conciliados).toHaveLength(1);
  });

  it("empty on both sides is empty", () => {
    expect(reconcile([], [])).toEqual({
      conciliados: [],
      diferencias: [],
      soloMiu: [],
      soloProveedor: [],
    });
  });
});

describe("cashier and refunds (Administrativo)", () => {
  it("only the Administrativo reaches payments, the cashier and refunds", async () => {
    const port = fresh();
    expect(await port.listPayments(student())).toMatchObject({ error: "forbidden" });
    expect(await port.findCashAccount(student(), "2024-0187")).toMatchObject({
      error: "forbidden",
    });
    expect(
      await port.registerCashPayment(student(), {
        carne: "2024-0187",
        chargeId: "cuota-noviembre",
      }),
    ).toMatchObject({ error: "forbidden" });
    expect(await port.refundPayment(student(), "pg-octubre", "Motivo suficiente")).toMatchObject({
      error: "forbidden",
    });
  });

  it("cash: finds the carné, takes the payment once, and the charge is paid", async () => {
    const port = fresh();
    const rodrigo = admin();
    expect(await port.findCashAccount(rodrigo, "9999-0000")).toMatchObject({ error: "not_found" });
    const account = value(await port.findCashAccount(rodrigo, "2024-0187"));
    expect(account.pendientes.map((c) => c.id)).toContain("cuota-noviembre");
    const receipt = value(
      await port.registerCashPayment(rodrigo, { carne: "2024-0187", chargeId: "cuota-noviembre" }),
    );
    expect(receipt).toMatchObject({ metodo: "presencial", estado: "pagado", comision: 0 });
    expect(
      await port.registerCashPayment(rodrigo, { carne: "2024-0187", chargeId: "cuota-noviembre" }),
    ).toMatchObject({ error: "invalid" });
    const mine = value(await port.listPayments(rodrigo)).find((p) => p.id === receipt.id)!;
    expect(mine).toMatchObject({ reembolsable: false, aprobadoPor: "p-rodrigo" });
    expect(mine.motivoBloqueo).toMatch(/otra persona/i);
  });

  it("refund: a reason is required, never by who took the payment, and once", async () => {
    const port = fresh();
    const rodrigo = admin();
    const taken = value(
      await port.registerCashPayment(rodrigo, { carne: "2024-0187", chargeId: "cuota-noviembre" }),
    );
    // Rodrigo took it: someone else must refund it.
    expect(await port.refundPayment(rodrigo, taken.id, "El cobro fue por error")).toMatchObject({
      error: "forbidden",
    });
    // A payment nobody here approved (seed history) can be refunded, with a reason.
    expect(await port.refundPayment(rodrigo, "pg-octubre", "corto")).toMatchObject({
      error: "invalid",
    });
    const refunded = value(
      await port.refundPayment(rodrigo, "pg-octubre", "Cobro duplicado confirmado con el banco"),
    );
    expect(refunded).toMatchObject({ estado: "reembolsado", reembolsable: false });
    expect(
      await port.refundPayment(rodrigo, "pg-octubre", "Cobro duplicado otra vez"),
    ).toMatchObject({
      error: "invalid",
    });
    // The student's receipt says refunded, and the charge is open again.
    expect(
      value(await port.listReceipts(student())).find((r) => r.id === "pg-octubre"),
    ).toBeTruthy();
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
