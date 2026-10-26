import { randomUUID } from "node:crypto";

import { z } from "zod";

import { academicNow } from "@/lib/clock";
import { parsed } from "@/lib/contract";
import { fail, ok, type PortResult } from "@/lib/result";
import { POLICY } from "@/mock/seed";
import { ledger, type LedgerPort } from "@/modules/finance";
import type { Actor } from "@/modules/identity";

import { quote, routeByCost } from "../../domain/rules";
import { sign, verifySignature } from "../../domain/signature";
import {
  Checkout,
  ProviderMethod,
  Quote,
  WebhookEvent,
  WebhookResult,
  type FeePolicy,
} from "../../domain/types";
import type { PaymentProviderPort } from "../../ports/payment-provider-port";

/** Webhook secret of the mock; the real one comes from Recurrente's dashboard in `.env.local`. */
export const MOCK_WEBHOOK_SECRET = "mock-recurrente-secret";

const DETAIL: Record<z.infer<typeof ProviderMethod>, string> = {
  ach: "Transferencia ACH",
  tarjeta: "Tarjeta terminada en 4242",
  apple_pay: "Apple Pay",
};

type StoredCheckout = z.infer<typeof Checkout> & { userId: string };

/**
 * Simulates Recurrente's hosted checkout and its signed webhook. The checkout page is local
 * (/pagos/checkout/[id]); paying there emits the same signed event the real provider would send.
 */
export class MockRecurrente implements PaymentProviderPort {
  private readonly checkouts = new Map<string, StoredCheckout>();
  private readonly processed = new Set<string>();

  constructor(
    private readonly ledgerPort: () => LedgerPort = ledger,
    private readonly policy: () => FeePolicy = () => POLICY.comisionTarjeta,
    private readonly secret = process.env.RECURRENTE_WEBHOOK_SECRET ?? MOCK_WEBHOOK_SECRET,
    private readonly now: () => Date = academicNow,
  ) {}

  async getPolicy() {
    return ok({ ...this.policy(), bancosAch: [...POLICY.bancosAch] });
  }

  async quote(monto: number, metodo: z.infer<typeof ProviderMethod>): PortResult<Quote> {
    if (!(monto > 0)) return fail("invalid", "El monto debe ser positivo");
    const all = routeByCost(monto, this.policy());
    return parsed(
      Quote,
      all.find((q) => q.metodo === metodo) ?? quote(monto, metodo, this.policy()),
    );
  }

  async quoteAll(monto: number): PortResult<Quote[]> {
    if (!(monto > 0)) return fail("invalid", "El monto debe ser positivo");
    return parsed(z.array(Quote), routeByCost(monto, this.policy()));
  }

  async createCheckout(
    actor: Actor,
    input: { chargeId: string; metodo: z.infer<typeof ProviderMethod> },
  ) {
    const metodo = ProviderMethod.safeParse(input.metodo);
    if (!metodo.success) return fail("invalid", "Método de pago no admitido");
    const charge = await this.ledgerPort().getCharge(actor, input.chargeId);
    if (!charge.ok) return charge;
    if (charge.value.estado !== "pendiente")
      return fail("invalid", "Este cargo ya no está pendiente");
    const q = quote(charge.value.monto, metodo.data, this.policy());
    const id = `chk_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
    const checkout: StoredCheckout = {
      id,
      userId: actor.userId,
      chargeId: charge.value.id,
      concepto: charge.value.concepto,
      metodo: metodo.data,
      monto: q.monto,
      comision: q.comision,
      total: q.total,
      url: `/pagos/checkout/${id}`,
      expira: new Date(this.now().getTime() + 30 * 60_000).toISOString(),
      estado: "abierto",
    };
    this.checkouts.set(id, checkout);
    return parsed(Checkout, checkout);
  }

  async getCheckout(actor: Actor, checkoutId: string) {
    const c = this.checkouts.get(checkoutId);
    if (!c || c.userId !== actor.userId) return fail("not_found");
    return parsed(Checkout, c);
  }

  async handleWebhook(rawBody: string, signature: string | null): PortResult<WebhookResult> {
    if (!verifySignature(rawBody, signature, this.secret))
      return fail("forbidden", "Firma inválida");
    let json: unknown;
    try {
      json = JSON.parse(rawBody);
    } catch {
      return fail("invalid", "Cuerpo que no es JSON");
    }
    const event = WebhookEvent.safeParse(json);
    if (!event.success) return fail("invalid", event.error.issues[0]?.message);
    const e = event.data;
    if (this.processed.has(e.id))
      return parsed(WebhookResult, { eventId: e.id, procesado: false, duplicado: true });
    const checkout = this.checkouts.get(e.checkoutId);
    if (!checkout) return fail("not_found", "Checkout desconocido");
    if (e.tipo === "checkout.failed") {
      this.processed.add(e.id);
      return parsed(WebhookResult, { eventId: e.id, procesado: true, duplicado: false });
    }
    if (Math.abs(e.monto - checkout.total) > 0.005)
      return fail("invalid", "El monto no coincide con el checkout");
    const receipt = await this.ledgerPort().settle({
      userId: checkout.userId,
      chargeId: checkout.chargeId,
      metodo: checkout.metodo,
      detalleMetodo: e.detalle,
      // What the student paid on top of the charge (0 when the university bears the fee).
      comision: Math.round((checkout.total - checkout.monto) * 100) / 100,
      fecha: e.fecha,
      referenciaProveedor: `pg-${checkout.id}`,
    });
    if (!receipt.ok) return receipt;
    this.processed.add(e.id);
    checkout.estado = "pagado";
    checkout.reciboId = receipt.value.id;
    return parsed(WebhookResult, {
      eventId: e.id,
      procesado: true,
      duplicado: false,
      reciboId: receipt.value.id,
    });
  }

  async refund(actor: Actor, reciboId: string, monto: number) {
    if (actor.role !== "administrativo") return fail("forbidden");
    if (!(monto > 0)) return fail("invalid", "El monto debe ser positivo");
    return ok({ id: `rf_${reciboId}`, estado: "solicitado" as const });
  }

  /** Mock only: the event Recurrente would send when the student pays on the hosted page. */
  buildPaidEvent(checkoutId: string) {
    const c = this.checkouts.get(checkoutId);
    if (!c) return null;
    const body = JSON.stringify({
      id: `evt_${c.id}`,
      tipo: "checkout.paid",
      checkoutId: c.id,
      monto: c.total,
      metodo: c.metodo,
      detalle: DETAIL[c.metodo],
      fecha: this.now().toISOString(),
    } satisfies WebhookEvent);
    return { body, signature: sign(body, this.secret) };
  }
}
