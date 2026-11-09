import { z } from "zod";

import { academicNow, daysBetween } from "@/lib/clock";
import { parsed } from "@/lib/contract";
import { fail, type PortResult } from "@/lib/result";
import { buildSeed, fullName, type Seed, type SeedPayment, type SeedTransfer } from "@/mock/seed";
import type { Actor } from "@/modules/identity";

import { cents, isSolventFrom, runningStatement } from "../../domain/rules";
import {
  AdminPayment,
  Balance,
  CashAccount,
  CashInput,
  Charge,
  QueuedTransfer,
  Receipt,
  Solvency,
  Statement,
  TransferInput,
  type SettledPayment,
} from "../../domain/types";
import type { LedgerPort, SolvencyPort } from "../../ports/ledger-port";

export type Payment = SeedPayment & {
  numero: string;
  aprobadoPor?: string;
  motivoReembolso?: string;
};

/**
 * Where payments a student makes survive an instance change. The mock keeps everything in memory, and
 * a serverless host answers the next request from another instance (or a new one) that has never seen
 * them: the receipt page would 404 and Pagos would still show the charge as pending. The app passes a
 * signed cookie (`cookieOverlay`); tests and `dev` need none.
 */
export interface PaymentOverlay {
  load(userId: string): Promise<Payment[]>;
  save(userId: string, payments: Payment[]): Promise<void>;
}
const NO_OVERLAY: PaymentOverlay = { load: async () => [], save: async () => {} };
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
  private readonly seedReviews = new Map<string, { estado: "pagado" | "rechazado"; por: string }>();
  /** Cash payments and refunds by the seeded Administrativo reach every workspace, like reviews. */
  private readonly seedCash: Payment[] = [];
  private readonly seedRefunds = new Map<string, string>();
  private counter = 0;

  constructor(
    private readonly seed: Seed = buildSeed(),
    private readonly now: () => Date = academicNow,
    private readonly overlay: PaymentOverlay = NO_OVERLAY,
  ) {}

  /** Merges what this browser says it already paid into the workspace; call first in every method. */
  private async hydrate(userId: string) {
    const saved = await this.overlay.load(userId);
    if (saved.length === 0) return;
    const ws = this.ws(userId);
    for (const p of saved) if (!ws.payments.some((x) => x.id === p.id)) ws.payments.push({ ...p });
    // New receipt numbers and ids must not repeat the ones already issued.
    this.counter = Math.max(this.counter, saved.length);
  }

  /** Hands the payments this student made (not the seeded ones) to the overlay. */
  private async persist(userId: string) {
    const seeded = new Set([...this.seed.payments, ...this.seedCash].map((p) => p.id));
    await this.overlay.save(
      userId,
      this.ws(userId).payments.filter((p) => !seeded.has(p.id)),
    );
  }

  private ws(userId: string): Workspace {
    let ws = this.workspaces.get(userId);
    if (!ws) {
      ws = {
        payments: this.seed.payments.map((p, i) => ({ ...p, numero: numero(i) })),
        queue: structuredClone(this.seed.transferQueue),
      };
      this.workspaces.set(userId, ws);
    }
    for (const cash of this.seedCash)
      if (!ws.payments.some((p) => p.id === cash.id)) ws.payments.push({ ...cash });
    for (const p of ws.payments) {
      const reviewed = this.seedReviews.get(p.id);
      if (reviewed && p.estado === "revision") {
        p.estado = reviewed.estado;
        p.aprobadoPor = reviewed.por;
      }
      const motivo = this.seedRefunds.get(p.id);
      if (motivo && p.estado === "pagado") {
        p.estado = "reembolsado";
        p.motivoReembolso = motivo;
      }
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
    await this.hydrate(actor.userId);
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
    await this.hydrate(actor.userId);
    const c = this.charges(actor).find((x) => x.id === chargeId);
    return c ? parsed(Charge, c) : fail("not_found");
  }

  async getBalance(actor: Actor): PortResult<Balance> {
    const denied = this.onlyStudent(actor);
    if (denied) return denied;
    await this.hydrate(actor.userId);
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
    await this.hydrate(actor.userId);
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
    await this.hydrate(actor.userId);
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
    await this.hydrate(actor.userId);
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
    await this.hydrate(payment.userId);
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
    await this.persist(payment.userId);
    return parsed(Receipt, this.toReceipt(p));
  }

  async submitTransfer(actor: Actor, input: TransferInput) {
    const denied = this.onlyStudent(actor);
    if (denied) return denied;
    const body = TransferInput.safeParse(input);
    if (!body.success) return fail("invalid", body.error.issues[0]?.message);
    await this.hydrate(actor.userId);
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
    await this.persist(actor.userId);
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
      if (p) {
        p.estado = result;
        p.aprobadoPor = actor.personId;
      }
    } else if (own?.paymentId && this.isSeedStaff(actor)) {
      this.seedReviews.set(own.paymentId, { estado: result, por: actor.personId });
    }
    return parsed(QueuedTransfer, {
      ...t,
      revisadoPor: actor.nombre,
      ...(decision.motivo ? { motivo: decision.motivo } : {}),
    });
  }

  private onlyAdmin(actor: Actor) {
    return actor.role === "administrativo" ? null : fail("forbidden");
  }

  private studentName() {
    const p = this.seed.people.find((x) => x.id === this.seed.student.id)!;
    return fullName(p);
  }

  private toAdminPayment(actor: Actor, p: Payment) {
    const own = p.aprobadoPor === actor.personId;
    const reembolsable = p.estado === "pagado" && !own;
    return {
      ...this.toReceipt(p),
      alumno: this.studentName(),
      carne: this.seed.student.carne ?? "",
      ...(p.aprobadoPor ? { aprobadoPor: p.aprobadoPor } : {}),
      reembolsable,
      ...(p.estado === "pagado" && own
        ? { motivoBloqueo: "Tú lo aprobaste: otra persona debe reembolsarlo" }
        : {}),
      ...(p.motivoReembolso ? { motivoReembolso: p.motivoReembolso } : {}),
    };
  }

  async listPayments(actor: Actor) {
    const denied = this.onlyAdmin(actor);
    if (denied) return denied;
    return parsed(
      z.array(AdminPayment),
      this.ws(actor.userId)
        .payments.filter((p) => p.estado === "pagado" || p.estado === "reembolsado")
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
        .map((p) => this.toAdminPayment(actor, p)),
    );
  }

  async findCashAccount(actor: Actor, carne: string) {
    const denied = this.onlyAdmin(actor);
    if (denied) return denied;
    if (carne.trim() !== this.seed.student.carne)
      return fail("not_found", "No encontramos ese carné");
    return parsed(CashAccount, {
      alumno: this.studentName(),
      carne: this.seed.student.carne ?? "",
      pendientes: this.charges(actor).filter((c) => c.estado === "pendiente"),
    });
  }

  async registerCashPayment(actor: Actor, input: CashInput) {
    const denied = this.onlyAdmin(actor);
    if (denied) return denied;
    const body = CashInput.safeParse(input);
    if (!body.success) return fail("invalid", body.error.issues[0]?.message);
    if (body.data.carne !== this.seed.student.carne)
      return fail("not_found", "No encontramos ese carné");
    const charge = this.charges(actor).find((c) => c.id === body.data.chargeId);
    if (!charge) return fail("not_found");
    if (charge.estado !== "pendiente") return fail("invalid", "Este cargo ya no está pendiente");
    const p: Payment = {
      id: `pg-caja-${++this.counter}`,
      numero: numero(this.seed.payments.length + this.counter),
      studentId: this.seed.student.id,
      chargeId: charge.id,
      concepto: charge.concepto,
      monto: charge.monto,
      metodo: "presencial",
      detalleMetodo: `Pago en caja · atendió ${actor.nombre}`,
      fecha: this.now().toISOString(),
      estado: "pagado",
      comision: 0,
      aprobadoPor: actor.personId,
    };
    this.ws(actor.userId).payments.push(p);
    if (this.isSeedStaff(actor)) this.seedCash.push({ ...p });
    return parsed(Receipt, this.toReceipt(p));
  }

  async refundPayment(actor: Actor, paymentId: string, motivo: string) {
    const denied = this.onlyAdmin(actor);
    if (denied) return denied;
    if (motivo.trim().length < 10)
      return fail("invalid", "Explica el motivo en al menos 10 caracteres");
    const p = this.ws(actor.userId).payments.find((x) => x.id === paymentId);
    if (!p) return fail("not_found");
    if (p.estado === "reembolsado") return fail("invalid", "Este pago ya se reembolsó");
    if (p.estado !== "pagado") return fail("invalid", "Solo se reembolsa un pago confirmado");
    if (p.aprobadoPor === actor.personId)
      return fail("forbidden", "Otra persona debe reembolsar un pago que tú aprobaste");
    p.estado = "reembolsado";
    p.motivoReembolso = motivo.trim();
    if (this.isSeedStaff(actor)) this.seedRefunds.set(p.id, motivo.trim());
    return parsed(AdminPayment, this.toAdminPayment(actor, p));
  }
}
