import { z } from "zod";

const money = z.number().nonnegative();

export const ProviderMethod = z.enum(["ach", "tarjeta", "apple_pay"]);
export type ProviderMethod = z.infer<typeof ProviderMethod>;

export type FeePolicy = {
  porcentaje: number;
  fijo: number;
  /** Who bears the card fee [S, pending UFM]. */
  pagador: "estudiante" | "universidad";
};

export const Quote = z.object({
  metodo: ProviderMethod,
  monto: money,
  /** Provider fee for this method. */
  comision: money,
  /** What the payer is charged. */
  total: money,
  pagador: z.enum(["estudiante", "universidad"]),
  /** How much less than the most expensive method. */
  ahorro: money,
});
export type Quote = z.infer<typeof Quote>;

export const Checkout = z.object({
  id: z.string(),
  chargeId: z.string(),
  concepto: z.string(),
  metodo: ProviderMethod,
  monto: money,
  comision: money,
  total: money,
  /** Hosted checkout page (Recurrente). In the mock it is a local simulation. */
  url: z.string(),
  expira: z.string(),
  estado: z.enum(["abierto", "pagado", "expirado"]),
  reciboId: z.string().optional(),
});
export type Checkout = z.infer<typeof Checkout>;

export const WebhookEvent = z.object({
  id: z.string().min(1),
  tipo: z.enum(["checkout.paid", "checkout.failed"]),
  checkoutId: z.string(),
  monto: money,
  metodo: ProviderMethod,
  detalle: z.string(),
  fecha: z.string(),
});
export type WebhookEvent = z.infer<typeof WebhookEvent>;

export const WebhookResult = z.object({
  eventId: z.string(),
  procesado: z.boolean(),
  duplicado: z.boolean(),
  reciboId: z.string().optional(),
});
export type WebhookResult = z.infer<typeof WebhookResult>;

/** One line of the provider's settlement statement, by the reference MiU also records. */
export const Settlement = z.object({
  referencia: z.string(),
  metodo: ProviderMethod,
  total: z.number(),
  fecha: z.string(),
});
export type Settlement = z.infer<typeof Settlement>;
