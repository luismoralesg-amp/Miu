import { describe, expect, it } from "vitest";

import { at } from "@/mock/seed";
import { MockAcademic } from "@/modules/academic/adapters/mock/mock-academic";
import { MockAssessment } from "@/modules/assessment/adapters/mock/mock-assessment";
import { MockLedger } from "@/modules/finance/adapters/mock/mock-ledger";
import { MockInbox } from "@/modules/inbox/adapters/mock/mock-inbox";
import { student, value } from "@/test/actors";

import { bellBadge } from "./inbox-view";

describe("bell badge", () => {
  it("is the length of the same inbox the Bandeja lists, before and after reading", async () => {
    const now = () => new Date(at(0, "07:42"));
    const acad = new MockAcademic();
    const assess = new MockAssessment(undefined, now);
    const led = new MockLedger(undefined, now);
    const inbox = new MockInbox(
      { academic: () => acad, assessment: () => assess, ledger: () => led },
      now,
    );
    const ana = student();
    const box = value(await inbox.listItems(ana));
    expect(bellBadge(box.items).count).toBe(box.total);
    expect(box.porTipo.pago).toBe(1);
    await inbox.markRead(ana, box.items.find((i) => i.tipo === "aviso")!.id);
    const after = value(await inbox.listItems(ana));
    expect(bellBadge(after.items).count).toBe(after.items.length);
    expect(bellBadge(after.items).count).toBe(box.total - 1);
    expect(bellBadge([]).label).toBe("Bandeja");
  });
});
