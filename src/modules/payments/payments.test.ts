import { describe, expect, it } from "vitest";

import { at } from "@/mock/seed";
import {
  MockLedger,
  type Payment,
  type PaymentOverlay,
} from "@/modules/finance/adapters/mock/mock-ledger";
import { admin, student, value } from "@/test/actors";

import { MOCK_WEBHOOK_SECRET, MockRecurrente } from "./adapters/mock/mock-recurrente";
import { createRealRecurrente } from "./adapters/real/real-recurrente";
import { createStripe } from "./adapters/real/stripe";
import { fee, quote, routeByCost } from "./domain/rules";
import { sign, verifySignature } from "./domain/signature";

const POLICY = { porcentaje: 4.5, fijo: 2, pagador: "estudiante" as const };
const now = () => new Date(at(0, "07:42"));
function setup() {
  const ledger = new MockLedger(undefined, now);
  const provider = new MockRecurrente(
    () => ledger,
    () => POLICY,
    MOCK_WEBHOOK_SECRET,
    now,
  );
  return { ledger, provider };
}

describe("cost routing [S: fee paid by the payer, pending UFM]", () => {
  it("ACH has no fee; card and Apple Pay pay 4.5% + Q2", () => {
    expect(fee(7387.8, "ach", POLICY)).toBe(0);
    expect(fee(7387.8, "tarjeta", POLICY)).toBe(334.45);
    expect(quote(7387.8, "tarjeta", POLICY)).toMatchObject({ comision: 334.45, total: 7722.25 });
    expect(quote(7387.8, "apple_pay", POLICY).total).toBe(7722.25);
  });

  it("cheapest first, with the saving visible", () => {
    const route = routeByCost(7387.8, POLICY);
    expect(route.map((q) => q.metodo)).toEqual(["ach", "tarjeta", "apple_pay"]);
    expect(route[0]).toMatchObject({ total: 7387.8, ahorro: 334.45 });
  });

  it("if the university bears the fee, the payer pays the charge only", () => {
    expect(quote(100, "tarjeta", { ...POLICY, pagador: "universidad" })).toMatchObject({
      comision: 6.5,
      total: 100,
    });
  });
});

describe("webhook signature", () => {
  it("accepts the exact body and nothing else", () => {
    const body = '{"id":"evt_1"}';
    const sig = sign(body, "s3cret");
    expect(verifySignature(body, sig, "s3cret")).toBe(true);
    expect(verifySignature(`${body} `, sig, "s3cret")).toBe(false);
    expect(verifySignature(body, sig, "otro")).toBe(false);
    expect(verifySignature(body, "zz", "s3cret")).toBe(false);
    expect(verifySignature(body, null, "s3cret")).toBe(false);
  });
});

describe("PaymentProviderPort (mock Recurrente)", () => {
  it("quoteAll: routed by cost; rejects non-positive amounts", async () => {
    const { provider } = setup();
    expect(value(await provider.quoteAll(7387.8))[0]!.metodo).toBe("ach");
    expect(await provider.quote(0, "ach")).toMatchObject({ error: "invalid" });
  });

  it("createCheckout: hosted page for a pending charge only", async () => {
    const { provider } = setup();
    const ana = student();
    const c = value(
      await provider.createCheckout(ana, { chargeId: "cuota-noviembre", metodo: "tarjeta" }),
    );
    expect(c).toMatchObject({ total: 7722.25, comision: 334.45, estado: "abierto" });
    expect(c.url).toBe(`/pagos/checkout/${c.id}`);
    expect(await provider.getCheckout(student(), c.id)).toMatchObject({ error: "not_found" });
    expect(
      await provider.createCheckout(ana, { chargeId: "multa-biblioteca", metodo: "ach" }),
    ).toMatchObject({
      error: "invalid",
    });
  });

  it("handleWebhook: settles once; a repeated event does not duplicate the charge", async () => {
    const { provider, ledger } = setup();
    const ana = student();
    const c = value(
      await provider.createCheckout(ana, { chargeId: "cuota-noviembre", metodo: "ach" }),
    );
    const event = provider.buildPaidEvent(c.id)!;
    const first = value(await provider.handleWebhook(event.body, event.signature));
    expect(first).toMatchObject({ procesado: true, duplicado: false });
    const again = value(await provider.handleWebhook(event.body, event.signature));
    expect(again).toMatchObject({ procesado: false, duplicado: true });
    const receipts = value(await ledger.listReceipts(ana)).filter(
      (r) => r.chargeId === "cuota-noviembre",
    );
    expect(receipts).toHaveLength(1);
    expect(receipts[0]).toMatchObject({ estado: "pagado", comision: 0, total: 7387.8 });
    expect(value(await ledger.getBalance(ana)).saldo).toBe(0);
    expect(value(await provider.getCheckout(ana, c.id)).estado).toBe("pagado");
  });

  it("handleWebhook: rejects a bad signature, a tampered body and a wrong amount", async () => {
    const { provider } = setup();
    const c = value(
      await provider.createCheckout(student(), { chargeId: "cuota-noviembre", metodo: "tarjeta" }),
    );
    const event = provider.buildPaidEvent(c.id)!;
    expect(await provider.handleWebhook(event.body, "0".repeat(64))).toMatchObject({
      error: "forbidden",
    });
    const tampered = event.body.replace("7722.25", "1");
    expect(await provider.handleWebhook(tampered, event.signature)).toMatchObject({
      error: "forbidden",
    });
    const cheap = event.body.replace("7722.25", "7387.8");
    expect(await provider.handleWebhook(cheap, sign(cheap, MOCK_WEBHOOK_SECRET))).toMatchObject({
      error: "invalid",
    });
    expect(await provider.handleWebhook("nope", sign("nope", MOCK_WEBHOOK_SECRET))).toMatchObject({
      error: "invalid",
    });
  });

  it("refund: only the Administrativo can request one", async () => {
    const { provider } = setup();
    expect(await provider.refund(student(), "pg-octubre", 10)).toMatchObject({
      error: "forbidden",
    });
    expect(value(await provider.refund(admin(), "pg-octubre", 10)).estado).toBe("solicitado");
  });

  it("Recurrente real and Stripe answer unavailable until connected", async () => {
    expect(await createRealRecurrente().quoteAll(10)).toMatchObject({ error: "unavailable" });
    expect(await createStripe().quoteAll(10)).toMatchObject({ error: "unavailable" });
  });
});

describe("payment policy", () => {
  it("is read through the port, with the ACH banks [S]", async () => {
    const { provider } = setup();
    expect(value(await provider.getPolicy())).toMatchObject({
      porcentaje: 4.5,
      fijo: 2,
      pagador: "estudiante",
    });
    expect(value(await provider.getPolicy()).bancosAch).toContain("BAC");
  });
});

describe("settlement statement", () => {
  it("lists the provider's payments, plus one MiU has no receipt for; only the Administrativo", async () => {
    const { provider } = setup();
    expect(await provider.listSettlements(student())).toMatchObject({ error: "forbidden" });
    const rows = value(await provider.listSettlements(admin()));
    expect(rows.some((r) => r.referencia === "pg-octubre")).toBe(true);
    expect(rows.some((r) => r.referencia === "evt_sin_recibo_4821")).toBe(true);
    expect(rows.every((r) => r.metodo !== ("presencial" as string))).toBe(true);
  });
});

/**
 * Vercel answers each request from a possibly new instance. Every call below builds a brand-new
 * ledger and provider (an "instance" with an empty memory); the only thing they share is what the
 * browser carries, which the overlay stands for. Before the fix, an open checkout lived in one
 * provider's memory and `getCheckout` on the next instance answered `not_found` (a 404 page).
 */
describe("a payment across serverless instances", () => {
  function browser() {
    const jar = new Map<string, Payment[]>();
    const overlay: PaymentOverlay = {
      load: async (userId) => jar.get(userId) ?? [],
      save: async (userId, payments) => void jar.set(userId, structuredClone(payments)),
    };
    const instance = () => {
      const ledger = new MockLedger(undefined, now, overlay);
      const provider = new MockRecurrente(
        () => ledger,
        () => POLICY,
        MOCK_WEBHOOK_SECRET,
        now,
      );
      return { ledger, provider };
    };
    return { instance };
  }

  it("opens on one instance, is read on another, is paid on a third and shows paid on a fourth", async () => {
    const { instance } = browser();
    const ana = student();
    const checkout = value(
      await instance().provider.createCheckout(ana, { chargeId: "cuota-noviembre", metodo: "ach" }),
    );

    const second = instance();
    expect(value(await second.provider.getCheckout(ana, checkout.id))).toMatchObject({
      chargeId: "cuota-noviembre",
      concepto: "Cuota de noviembre",
      total: 7387.8,
      estado: "abierto",
    });

    const third = instance();
    const event = third.provider.buildPaidEvent(checkout.id)!;
    expect(value(await third.provider.handleWebhook(event.body, event.signature))).toMatchObject({
      procesado: true,
    });

    const fourth = instance();
    expect(value(await fourth.provider.getCheckout(ana, checkout.id))).toMatchObject({
      estado: "pagado",
      reciboId: `pg-${checkout.id}`,
    });
    expect(value(await fourth.ledger.getBalance(ana)).saldo).toBe(0);
    expect(value(await fourth.ledger.listCharges(ana)).map((c) => c.id)).not.toContain(
      "cuota-noviembre",
    );
    expect(value(await fourth.ledger.listReceipts(ana))[0]).toMatchObject({
      id: checkout.id.replace(/^/, "pg-"),
      estado: "pagado",
      total: 7387.8,
    });
  });

  it("a card payment keeps its fee, and a repeated event on another instance pays only once", async () => {
    const { instance } = browser();
    const ana = student();
    const checkout = value(
      await instance().provider.createCheckout(ana, {
        chargeId: "cuota-noviembre",
        metodo: "tarjeta",
      }),
    );
    const a = instance();
    const event = a.provider.buildPaidEvent(checkout.id)!;
    await a.provider.handleWebhook(event.body, event.signature);
    const b = instance();
    const again = value(await b.provider.handleWebhook(event.body, event.signature));
    expect(again.reciboId).toBe(`pg-${checkout.id}`);
    const paid = value(await instance().ledger.listReceipts(ana)).filter(
      (r) => r.chargeId === "cuota-noviembre",
    );
    expect(paid).toHaveLength(1);
    expect(paid[0]).toMatchObject({ comision: 334.45, total: 7722.25 });
  });

  it("a transfer with receipt stays in review on the next instance", async () => {
    const { instance } = browser();
    const ana = student();
    value(
      await instance().ledger.submitTransfer(ana, {
        chargeId: "cuota-noviembre",
        banco: "Banco Industrial",
        boleta: "TRX-77881",
        archivo: "boleta.pdf",
      }),
    );
    const next = instance();
    const charge = value(await next.ledger.getCharge(ana, "cuota-noviembre"));
    expect(charge.estado).toBe("en_revision");
    expect(
      value(await next.ledger.listReceipts(ana)).find((r) => r.chargeId === "cuota-noviembre"),
    ).toMatchObject({ estado: "revision" });
  });

  it("a checkout cannot be forged, borrowed or read by someone else", async () => {
    const { instance } = browser();
    const ana = student();
    const checkout = value(
      await instance().provider.createCheckout(ana, { chargeId: "cuota-noviembre", metodo: "ach" }),
    );
    const other = instance().provider;
    // Another person with the same link.
    expect(await other.getCheckout(student(), checkout.id)).toMatchObject({ error: "not_found" });
    // A token whose amount was edited no longer matches its signature.
    const [body, sig] = checkout.id.slice(4).split(".");
    const claims = JSON.parse(Buffer.from(body!, "base64url").toString());
    const edited = Buffer.from(JSON.stringify({ ...claims, t: 1, a: 1 })).toString("base64url");
    expect(await other.getCheckout(ana, `chk_${edited}.${sig}`)).toMatchObject({
      error: "not_found",
    });
    expect(other.buildPaidEvent(`chk_${edited}.${sig}`)).toBeNull();
    expect(await other.getCheckout(ana, "chk_inventado")).toMatchObject({ error: "not_found" });
  });
});
