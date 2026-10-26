import { describe, expect, it } from "vitest";

import { at } from "@/mock/seed";
import { MockLedger } from "@/modules/finance/adapters/mock/mock-ledger";
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
