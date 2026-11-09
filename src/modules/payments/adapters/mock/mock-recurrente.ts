import { randomBytes } from "node:crypto";

import { z } from "zod";

import { academicNow } from "@/lib/clock";
import { parsed } from "@/lib/contract";
import { signToken, verifyToken } from "@/lib/demo-token";
import { fail, ok, type PortResult } from "@/lib/result";
import { ledger, type LedgerPort } from "@/modules/finance";
import type { Actor } from "@/modules/identity";
import { currentPolicy } from "@/modules/policy";

import { quote, routeByCost } from "../../domain/rules";
import { sign, verifySignature } from "../../domain/signature";
import {
  Checkout,
  ProviderMethod,
  Quote,
  Settlement,
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

/**
 * What a checkout id carries. The id *is* the checkout (`chk_<signed token>`), so a serverless host
 * that answers the next request from another instance, or a new one, still finds it: nothing about an
 * open checkout lives in one instance's memory. Whether it was paid is read from the ledger.
 */
type CheckoutClaims = {
  k: "c";
  /** Who opened it. */
  u: string;
  /** Charge. */
  c: string;
  m: z.infer<typeof ProviderMethod>;
  /** Amount of the charge, fee, and what the payer is charged. */
  a: number;
  f: number;
  t: number;
  /** Expires, epoch seconds. */
  e: number;
  /** Two checkouts opened for the same charge and method are still different checkouts. */
  n: string;
};

const CHECKOUT_PREFIX = "chk_";

function openCheckout(id: string): { claims: CheckoutClaims } | null {
  if (!id.startsWith(CHECKOUT_PREFIX)) return null;
  const claims = verifyToken<CheckoutClaims>(id.slice(CHECKOUT_PREFIX.length));
  if (!claims || claims.k !== "c" || !ProviderMethod.safeParse(claims.m).success) return null;
  return { claims };
}

/**
 * Simulates Recurrente's hosted checkout and its signed webhook. The checkout page is local
 * (/pagos/checkout/[id]); paying there emits the same signed event the real provider would send.
 */
export class MockRecurrente implements PaymentProviderPort {
  private readonly processed = new Set<string>();

  constructor(
    private readonly ledgerPort: () => LedgerPort = ledger,
    private readonly policy: () => FeePolicy = () => currentPolicy().comisionTarjeta,
    private readonly secret = process.env.RECURRENTE_WEBHOOK_SECRET ?? MOCK_WEBHOOK_SECRET,
    private readonly now: () => Date = academicNow,
  ) {}

  async getPolicy() {
    return ok({ ...this.policy(), bancosAch: currentPolicy().bancosAch });
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
    const expira = new Date(this.now().getTime() + 30 * 60_000);
    const id =
      CHECKOUT_PREFIX +
      signToken({
        k: "c",
        u: actor.userId,
        c: charge.value.id,
        m: metodo.data,
        a: q.monto,
        f: q.comision,
        t: q.total,
        e: Math.floor(expira.getTime() / 1000),
        n: randomBytes(4).toString("hex"),
      } satisfies CheckoutClaims);
    return parsed(Checkout, {
      id,
      chargeId: charge.value.id,
      concepto: charge.value.concepto,
      metodo: metodo.data,
      monto: q.monto,
      comision: q.comision,
      total: q.total,
      url: `/pagos/checkout/${id}`,
      expira: expira.toISOString(),
      estado: "abierto",
    });
  }

  async getCheckout(actor: Actor, checkoutId: string) {
    const opened = openCheckout(checkoutId);
    if (!opened || opened.claims.u !== actor.userId) return fail("not_found");
    const { claims } = opened;
    const charge = await this.ledgerPort().getCharge(actor, claims.c);
    if (!charge.ok) return fail("not_found");
    // Paid or not is the ledger's to say: it holds the receipt this checkout's payment produced.
    const receipts = await this.ledgerPort().listReceipts(actor);
    const receipt = receipts.ok
      ? receipts.value.find((r) => r.id === `pg-${checkoutId}` && r.estado === "pagado")
      : undefined;
    return parsed(Checkout, {
      id: checkoutId,
      chargeId: claims.c,
      concepto: charge.value.concepto,
      metodo: claims.m,
      monto: claims.a,
      comision: claims.f,
      total: claims.t,
      url: `/pagos/checkout/${checkoutId}`,
      expira: new Date(claims.e * 1000).toISOString(),
      estado: receipt ? "pagado" : "abierto",
      ...(receipt ? { reciboId: receipt.id } : {}),
    });
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
    const opened = openCheckout(e.checkoutId);
    if (!opened) return fail("not_found", "Checkout desconocido");
    const checkout = opened.claims;
    if (e.tipo === "checkout.failed") {
      this.processed.add(e.id);
      return parsed(WebhookResult, { eventId: e.id, procesado: true, duplicado: false });
    }
    if (Math.abs(e.monto - checkout.t) > 0.005)
      return fail("invalid", "El monto no coincide con el checkout");
    const receipt = await this.ledgerPort().settle({
      userId: checkout.u,
      chargeId: checkout.c,
      metodo: checkout.m,
      detalleMetodo: e.detalle,
      // What the student paid on top of the charge (0 when the university bears the fee).
      comision: Math.round((checkout.t - checkout.a) * 100) / 100,
      fecha: e.fecha,
      referenciaProveedor: `pg-${e.checkoutId}`,
    });
    if (!receipt.ok) return receipt;
    this.processed.add(e.id);
    return parsed(WebhookResult, {
      eventId: e.id,
      procesado: true,
      duplicado: false,
      reciboId: receipt.value.id,
    });
  }

  /**
   * The statement mirrors MiU's own provider payments, plus one event MiU has no receipt for [S]: the
   * kind of gap reconciliation exists to find.
   */
  async listSettlements(actor: Actor) {
    if (actor.role !== "administrativo") return fail("forbidden");
    const payments = await this.ledgerPort().listPayments(actor);
    if (!payments.ok) return payments;
    const rows = payments.value
      .filter((p) => p.metodo === "ach" || p.metodo === "tarjeta" || p.metodo === "apple_pay")
      .map((p) => ({
        referencia: p.id,
        metodo: p.metodo as z.infer<typeof ProviderMethod>,
        total: p.total,
        fecha: p.fecha,
      }));
    rows.push({
      referencia: "evt_sin_recibo_4821",
      metodo: "tarjeta",
      total: 1500,
      fecha: "2026-10-20T15:10:00-06:00",
    });
    return parsed(z.array(Settlement), rows);
  }

  async refund(actor: Actor, reciboId: string, monto: number) {
    if (actor.role !== "administrativo") return fail("forbidden");
    if (!(monto > 0)) return fail("invalid", "El monto debe ser positivo");
    return ok({ id: `rf_${reciboId}`, estado: "solicitado" as const });
  }

  /** Mock only: the event Recurrente would send when the student pays on the hosted page. */
  buildPaidEvent(checkoutId: string) {
    const c = openCheckout(checkoutId)?.claims;
    if (!c) return null;
    const body = JSON.stringify({
      id: `evt_${checkoutId}`,
      tipo: "checkout.paid",
      checkoutId,
      monto: c.t,
      metodo: c.m,
      detalle: DETAIL[c.m],
      fecha: this.now().toISOString(),
    } satisfies WebhookEvent);
    return { body, signature: sign(body, this.secret) };
  }
}
