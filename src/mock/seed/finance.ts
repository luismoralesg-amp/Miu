import { at, day } from "./time";

export type PaymentMethod = "ach" | "tarjeta" | "apple_pay" | "transferencia" | "presencial";

export type SeedCharge = {
  id: string;
  studentId: string;
  concepto: string;
  monto: number;
  emitido: string;
  vence: string;
  referencia: string;
  desglose: Array<[concepto: string, monto: number]>;
};

/** What the demo student owes. Paying it is the E2E "pagar y consultar" flow. */
export const CHARGES: SeedCharge[] = [
  {
    id: "cuota-noviembre",
    studentId: "p-ana",
    concepto: "Cuota de noviembre",
    monto: 7387.8,
    emitido: day(-22),
    vence: day(6),
    referencia: "MIU-26-004127",
    desglose: [
      ["Colegiatura", 6950],
      ["Laboratorio de cómputo", 312.8],
      ["Seguro estudiantil", 125],
    ],
  },
];

export type SeedPayment = {
  id: string;
  studentId: string;
  chargeId: string;
  concepto: string;
  monto: number;
  metodo: PaymentMethod;
  detalleMetodo: string;
  fecha: string;
  estado: "pagado" | "revision" | "rechazado" | "reembolsado";
  comision: number;
};

export const PAYMENTS: SeedPayment[] = [
  {
    id: "pg-multa",
    studentId: "p-ana",
    chargeId: "multa-biblioteca",
    concepto: "Multa de biblioteca",
    monto: 45,
    metodo: "transferencia",
    detalleMetodo: "Depósito con comprobante",
    fecha: at(-8, "11:20"),
    estado: "revision",
    comision: 0,
  },
  {
    id: "pg-octubre",
    studentId: "p-ana",
    chargeId: "cuota-octubre",
    concepto: "Cuota de octubre",
    monto: 7387.8,
    metodo: "ach",
    detalleMetodo: "Transferencia ACH",
    fecha: at(-26, "09:12"),
    estado: "pagado",
    comision: 0,
  },
  {
    id: "pg-septiembre",
    studentId: "p-ana",
    chargeId: "cuota-septiembre",
    concepto: "Cuota de septiembre",
    monto: 7387.8,
    metodo: "tarjeta",
    detalleMetodo: "Tarjeta terminada en 4417",
    fecha: at(-56, "18:45"),
    estado: "pagado",
    comision: 334.45,
  },
  {
    id: "pg-inscripcion",
    studentId: "p-ana",
    chargeId: "inscripcion",
    concepto: "Inscripción 2026-2",
    monto: 1500,
    metodo: "ach",
    detalleMetodo: "Transferencia ACH",
    fecha: at(-80, "10:02"),
    estado: "pagado",
    comision: 0,
  },
];

/** Charges already settled, so the statement can show what each payment covered. */
export const PAST_CHARGES: Array<Omit<SeedCharge, "referencia" | "desglose">> = [
  {
    id: "inscripcion",
    studentId: "p-ana",
    concepto: "Inscripción 2026-2",
    monto: 1500,
    emitido: day(-95),
    vence: day(-80),
  },
  {
    id: "cuota-septiembre",
    studentId: "p-ana",
    concepto: "Cuota de septiembre",
    monto: 7387.8,
    emitido: day(-82),
    vence: day(-54),
  },
  {
    id: "cuota-octubre",
    studentId: "p-ana",
    concepto: "Cuota de octubre",
    monto: 7387.8,
    emitido: day(-52),
    vence: day(-24),
  },
  {
    id: "multa-biblioteca",
    studentId: "p-ana",
    concepto: "Multa de biblioteca",
    monto: 45,
    emitido: day(-12),
    vence: day(-2),
  },
];

/** Bank transfers waiting for a person in finance to match them to a charge. */
export type SeedTransfer = {
  id: string;
  paymentId?: string;
  alumno: string;
  carne: string;
  concepto: string;
  monto: number;
  banco: string;
  boleta: string;
  fecha: string;
  estado: "pendiente" | "aprobada" | "rechazada";
};

export const TRANSFER_QUEUE: SeedTransfer[] = [
  {
    id: "tr-1",
    paymentId: "pg-multa",
    alumno: "Ana López",
    carne: "2024-0187",
    concepto: "Multa de biblioteca",
    monto: 45,
    banco: "Depósito en ventanilla",
    boleta: "0048213",
    fecha: at(-8, "11:20"),
    estado: "pendiente",
  },
  {
    id: "tr-2",
    alumno: "Bruno Chávez",
    carne: "2024-0119",
    concepto: "Cuota de noviembre",
    monto: 7387.8,
    banco: "Transferencia interbancaria",
    boleta: "TRX-55120",
    fecha: at(-2, "15:42"),
    estado: "pendiente",
  },
  {
    id: "tr-3",
    alumno: "Mariela Navas",
    carne: "2024-0196",
    concepto: "Cuota de noviembre",
    monto: 7000,
    banco: "Transferencia interbancaria",
    boleta: "TRX-55187",
    fecha: at(-1, "09:05"),
    estado: "pendiente",
  },
  {
    id: "tr-4",
    alumno: "Samuel Sandoval",
    carne: "2024-0231",
    concepto: "Constancia de cursos",
    monto: 60,
    banco: "Depósito en ventanilla",
    boleta: "0048377",
    fecha: at(0, "07:10"),
    estado: "pendiente",
  },
];
