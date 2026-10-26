import { z } from "zod";

import { academicNow, daysBetween } from "@/lib/clock";
import { parsed } from "@/lib/contract";
import { fail, type PortResult } from "@/lib/result";
import { buildSeed, type Seed, type SeedPayment, type SeedTransfer } from "@/mock/seed";
import type { Actor } from "@/modules/identity";

import { cents, isSolventFrom, runningStatement } from "../../domain/rules";
import {
  Balance,
  Charge,
  QueuedTransfer,
  Receipt,
  Solvency,
  Statement,
  TransferInput,
  type SettledPayment,
} from "../../domain/types";
import type { LedgerPort, SolvencyPort } from "../../ports/ledger-port";

type Payment = SeedPayment & { numero: string };
type Workspace = { payments: Payment[]; queue: SeedTransfer[] };
type StudentTransfer = SeedTransfer & { userId: string; paymentId: string };

const numero = (i: number) => `R-26-${String(4100 + i).padStart(6, "0")}`;

/**
 * Seed plus a workspace per signed-in user (payments and, for the Administrativo, the seeded queue).
 * Transfers students submit go to one shared queue, so an Administrativo can approve what a student
 * sent from another session. Reviews by the seeded staff account also settle the seeded payments.
 */
export class MockLedger implements LedgerPort, SolvencyPort {
  private readonly workspaces = new Map<string, Workspace>();
  private readonly submitted: StudentTransfer[] = [];
  private readonly seedReviews = new Map<string, "pagado" | "rechazado">();
  private counter = 0;

  constructor(
    private readonly seed: Seed = buildSeed(),
    private readonly now: () => Date = academicNow,
  ) {}

  private ws(userId: string): Workspace {
    let ws = this.workspaces.get(userId);
    if (!ws) {
      ws = {
        payments: this.seed.payments.map((p, i) => ({ ...p, numero: numero(i) })),
        queue: structuredClone(this.seed.transferQueue),
      };
      this.workspaces.set(userId, ws);
    }
    for (const p of ws.payments) {
      const reviewed = this.seedReviews.get(p.id);
      if (reviewed && p.estado === "revision") p.estado = reviewed;
    }
    return ws;
  }

  private isSeedStaff(actor: Actor) {
    return this.seed.people.some((p) => p.userId === actor.userId && p.tipo === "administrativo");
  }

  private charges(actor: Actor) {
    const { payments } = this.ws(actor.userId);
    const now = this.now();
    const open = this.seed.charges.map((c) => ({ ...c, desglose: c.desglose }));
    const past = this.seed.pastCharges.map((c) => ({ ...c, referencia: "", desglose: [] }));
    return [...open, ...past].map((c) => {
      const pays = payments.filter((p) => p.chargeId === c.id);
      const estado = pays.some((p) => p.estado === "pagado")
        ? ("pagado" as const)
        : pays.some((p) => p.estado === "revision")
          ? ("en_revision" as const)
          : ("pendiente" as const);
      return {
        id: c.id,
        concepto: c.concepto,
        monto: c.monto,
        emitido: c.emitido,
        vence: c.vence,
        referencia: c.referencia || `MIU-26-${c.id.toUpperCase()}`,
        desglose: c.desglose.map(([concepto, monto]) => ({ concepto, monto })),
        estado,
        diasParaVencer: daysBetween(now, new Date(`${c.vence}T23:59:00-06:00`)),
      };
    });
  }

  private onlyStudent(actor: Actor) {
    return actor.role === "estudiante" ? null : fail("forbidden");
  }

  async listCharges(actor: Actor) {
    const denied = this.onlyStudent(actor);
    if (denied) return denied;
    return parsed(
      z.array(Charge),
      this.charges(actor)
        .filter((c) => c.estado !== "pagado")
        .sort((a, b) => a.vence.localeCompare(b.vence)),
    );
  }

  async getCharge(actor: Actor, chargeId: string) {
    const denied = this.onlyStudent(actor);
    if (denied) return denied;
    const c = this.charges(actor).find((x) => x.id === chargeId);
    return c ? parsed(Charge, c) : fail("not_found");
  }

  async getBalance(actor: Actor): PortResult<Balance> {
    const denied = this.onlyStudent(actor);
    if (denied) return denied;
    const pending = this.charges(actor)
      .filter((c) => c.estado === "pendiente")
      .sort((a, b) => a.vence.localeCompare(b.vence));
    return parsed(Balance, {
      saldo: cents(pending.reduce((s, c) => s + c.monto, 0)),
      pendientes: pending.length,
      proximo: pending[0] ?? null,
      solvente: isSolventFrom(this.charges(actor)),
    });
  }

  async isSolvent(actor: Actor): PortResult<Solvency> {
    const denied = this.onlyStudent(actor);
    if (denied) return denied;
    const overdue = this.charges(actor).find(
      (c) => c.estado === "pendiente" && c.diasParaVencer < 0,
    );
    return parsed(Solvency, {
      solvente: !overdue,
      motivo: overdue ? `${overdue.concepto} vencida` : null,
      hasta: overdue
        ? null
        : (this.charges(actor).find((c) => c.estado === "pendiente")?.vence ?? null),
    });
  }

  private toReceipt(p: Payment) {
    return {
      id: p.id,
      numero: p.numero,
      chargeId: p.chargeId,
      concepto: p.concepto,
      monto: p.monto,
      comision: p.comision,
      total: cents(p.monto + p.comision),
      metodo: p.metodo,
      detalleMetodo: p.detalleMetodo,
      fecha: p.fecha,
      estado: p.estado,
    };
  }

  async listReceipts(actor: Actor) {
    const denied = this.onlyStudent(actor);
    if (denied) return denied;
    return parsed(
      z.array(Receipt),
      [...this.ws(actor.userId).payments]
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
        .map((p) => this.toReceipt(p)),
    );
  }

  async getStatement(actor: Actor, range: { desde: string; hasta: string }): PortResult<Statement> {
    const denied = this.onlyStudent(actor);
    if (denied) return denied;
    if (range.desde > range.hasta)
      return fail("invalid", "La fecha inicial es posterior a la final");
    const lines = [
      ...this.charges(actor).map((c) => ({
        fecha: c.emitido,
        concepto: c.concepto,
        cargo: c.monto,
        abono: null,
      })),
      ...this.ws(actor.userId)
        .payments.filter((p) => p.estado === "pagado")
        .map((p) => ({
          fecha: p.fecha.slice(0, 10),
          concepto: `Pago: ${p.concepto} (${p.detalleMetodo})`,
          cargo: null,
          abono: p.monto,
        })),
    ];
    const all = runningStatement(lines);
    const before = all.filter((l) => l.fecha < range.desde);
    const inRange = all.filter(
      (l) => l.fecha >= range.desde && l.fecha <= range.hasta.slice(0, 10),
    );
    const saldoInicial = before.at(-1)?.saldo ?? 0;
    return parsed(Statement, {
      desde: range.desde,
      hasta: range.hasta,
      saldoInicial,
      saldoFinal: inRange.at(-1)?.saldo ?? saldoInicial,
      movimientos: inRange,
    });
  }

  async settle(payment: SettledPayment): PortResult<z.infer<typeof Receipt>> {
    const ws = this.ws(payment.userId);
    const charge = this.seed.charges.find((c) => c.id === payment.chargeId);
    if (!charge) return fail("not_found");
    const existing = ws.payments.find(
      (p) =>
        p.chargeId === charge.id && p.estado === "pagado" && p.id === payment.referenciaProveedor,
    );
    if (existing) return parsed(Receipt, this.toReceipt(existing));
    if (ws.payments.some((p) => p.chargeId === charge.id && p.estado === "pagado"))
      return fail("invalid", "El cargo ya está pagado");
    const p: Payment = {
      id: payment.referenciaProveedor,
      numero: numero(this.seed.payments.length + ++this.counter),
      studentId: this.seed.student.id,
      chargeId: charge.id,
      concepto: charge.concepto,
      monto: charge.monto,
      metodo: payment.metodo,
      detalleMetodo: payment.detalleMetodo,
      fecha: payment.fecha,
      estado: "pagado",
      comision: payment.comision,
    };
    ws.payments.push(p);
    return parsed(Receipt, this.toReceipt(p));
  }

  async submitTransfer(actor: Actor, input: TransferInput) {
    const denied = this.onlyStudent(actor);
    if (denied) return denied;
    const body = TransferInput.safeParse(input);
    if (!body.success) return fail("invalid", body.error.issues[0]?.message);
    const charge = this.charges(actor).find((c) => c.id === body.data.chargeId);
    if (!charge) return fail("not_found");
    if (charge.estado !== "pendiente") return fail("invalid", "Este cargo ya no está pendiente");
    const ws = this.ws(actor.userId);
    const id = `tr-${actor.userId}-${charge.id}-${++this.counter}`;
    const p: Payment = {
      id: `pg-${id}`,
      numero: numero(this.seed.payments.length + this.counter),
      studentId: actor.personId,
      chargeId: charge.id,
      concepto: charge.concepto,
      monto: charge.monto,
      metodo: "transferencia",
      detalleMetodo: `Transferencia con comprobante · boleta ${body.data.boleta}`,
      fecha: this.now().toISOString(),
      estado: "revision",
      comision: 0,
    };
    ws.payments.push(p);
    this.submitted.push({
      id,
      userId: actor.userId,
      paymentId: p.id,
      alumno: actor.nombre,
      carne: this.seed.student.carne ?? "",
      concepto: charge.concepto,
      monto: charge.monto,
      banco: body.data.banco,
      boleta: body.data.boleta,
      fecha: p.fecha,
      estado: "pendiente",
    });
    return parsed(Receipt, this.toReceipt(p));
  }

  async listTransferQueue(actor: Actor) {
    if (actor.role !== "administrativo") return fail("forbidden");
    const list = [...this.ws(actor.userId).queue, ...this.submitted].sort(
      (a, b) =>
        Number(a.estado !== "pendiente") - Number(b.estado !== "pendiente") ||
        a.fecha.localeCompare(b.fecha),
    );
    return parsed(
      z.array(QueuedTransfer),
      list.map(({ id, alumno, carne, concepto, monto, banco, boleta, fecha, estado }) => ({
        id,
        alumno,
        carne,
        concepto,
        monto,
        banco,
        boleta,
        fecha,
        estado,
      })),
    );
  }

  async reviewTransfer(
    actor: Actor,
    transferId: string,
    decision: { aprobar: boolean; motivo?: string },
  ) {
    if (actor.role !== "administrativo") return fail("forbidden");
    if (!decision.aprobar && !decision.motivo?.trim())
      return fail("invalid", "Escribe el motivo del rechazo para la estudiante");
    const own = this.ws(actor.userId).queue.find((t) => t.id === transferId);
    const student = this.submitted.find((t) => t.id === transferId);
    const t = own ?? student;
    if (!t) return fail("not_found");
    if (t.estado !== "pendiente") return fail("invalid", "Esta transferencia ya se revisó");
    t.estado = decision.aprobar ? "aprobada" : "rechazada";
    const result = decision.aprobar ? ("pagado" as const) : ("rechazado" as const);
    if (student) {
      const p = this.ws(student.userId).payments.find((x) => x.id === student.paymentId);
      if (p) p.estado = result;
    } else if (own?.paymentId && this.isSeedStaff(actor)) {
      this.seedReviews.set(own.paymentId, result);
    }
    return parsed(QueuedTransfer, {
      ...t,
      revisadoPor: actor.nombre,
      ...(decision.motivo ? { motivo: decision.motivo } : {}),
    });
  }
}
