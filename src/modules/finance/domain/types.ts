import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}/);
const money = z.number().nonnegative().multipleOf(0.01);

export const PaymentMethod = z.enum(["ach", "tarjeta", "apple_pay", "transferencia", "presencial"]);
export type PaymentMethod = z.infer<typeof PaymentMethod>;

export const methodLabel: Record<PaymentMethod, string> = {
  ach: "Transferencia ACH",
  tarjeta: "Tarjeta",
  apple_pay: "Apple Pay",
  transferencia: "Transferencia con comprobante",
  presencial: "Pago en caja",
};

export const Charge = z.object({
  id: z.string(),
  concepto: z.string(),
  monto: money,
  emitido: isoDate,
  vence: isoDate,
  referencia: z.string(),
  desglose: z.array(z.object({ concepto: z.string(), monto: money })),
  estado: z.enum(["pendiente", "en_revision", "pagado"]),
  /** Negative when overdue. */
  diasParaVencer: z.number().int(),
});
export type Charge = z.infer<typeof Charge>;

export const Receipt = z.object({
  id: z.string(),
  numero: z.string(),
  chargeId: z.string(),
  concepto: z.string(),
  monto: money,
  comision: money,
  total: money,
  metodo: PaymentMethod,
  detalleMetodo: z.string(),
  fecha: isoDate,
  estado: z.enum(["pagado", "revision", "rechazado", "reembolsado"]),
});
export type Receipt = z.infer<typeof Receipt>;

export const Balance = z.object({
  saldo: money,
  pendientes: z.number().int().nonnegative(),
  proximo: Charge.nullable(),
  solvente: z.boolean(),
});
export type Balance = z.infer<typeof Balance>;

export const StatementLine = z.object({
  fecha: isoDate,
  concepto: z.string(),
  cargo: money.nullable(),
  abono: money.nullable(),
  saldo: z.number(),
});
export const Statement = z.object({
  desde: isoDate,
  hasta: isoDate,
  saldoInicial: z.number(),
  saldoFinal: z.number(),
  movimientos: z.array(StatementLine),
});
export type Statement = z.infer<typeof Statement>;

export const Solvency = z.object({
  solvente: z.boolean(),
  motivo: z.string().nullable(),
  hasta: isoDate.nullable(),
});
export type Solvency = z.infer<typeof Solvency>;

export const TransferInput = z.object({
  chargeId: z.string(),
  banco: z.string().trim().min(2).max(80),
  boleta: z.string().trim().min(3).max(40),
  archivo: z.string().trim().min(1).max(200),
});
export type TransferInput = z.infer<typeof TransferInput>;

export const QueuedTransfer = z.object({
  id: z.string(),
  alumno: z.string(),
  carne: z.string(),
  concepto: z.string(),
  monto: money,
  banco: z.string(),
  boleta: z.string(),
  fecha: isoDate,
  estado: z.enum(["pendiente", "aprobada", "rechazada"]),
  revisadoPor: z.string().optional(),
  motivo: z.string().optional(),
});
export type QueuedTransfer = z.infer<typeof QueuedTransfer>;

/** What a confirmed provider payment writes into the ledger. */
export type SettledPayment = {
  userId: string;
  chargeId: string;
  metodo: PaymentMethod;
  detalleMetodo: string;
  comision: number;
  fecha: string;
  referenciaProveedor: string;
};

/** A payment as the Administrativo sees it: whose, how, and whether this person may refund it. */
export const AdminPayment = Receipt.extend({
  alumno: z.string(),
  carne: z.string(),
  /** Whoever approved or took the payment (a person id); a refund needs someone else. */
  aprobadoPor: z.string().optional(),
  /** Refundable by the signed-in person: paid, and not approved by themselves. */
  reembolsable: z.boolean(),
  motivoBloqueo: z.string().optional(),
  motivoReembolso: z.string().optional(),
});
export type AdminPayment = z.infer<typeof AdminPayment>;

/** A student account found at the cashier by carné, with what they can pay now. */
export const CashAccount = z.object({
  alumno: z.string(),
  carne: z.string(),
  pendientes: z.array(Charge),
});
export type CashAccount = z.infer<typeof CashAccount>;

export const CashInput = z.object({ carne: z.string().trim().min(4), chargeId: z.string() });
export type CashInput = z.infer<typeof CashInput>;
