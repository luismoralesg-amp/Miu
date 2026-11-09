import { readDemoCookie, writeDemoCookie } from "@/lib/demo-cookie";

import type { Payment, PaymentOverlay } from "./mock-ledger";

const COOKIE = "miu-pagos";
/** A cookie holds about 4 KB: a demo student makes a handful of payments, the newest four are kept. */
const KEEP = 4;
const TWELVE_HOURS = 12 * 60 * 60;

type Saved = { k: "p"; u: string; p: Payment[] };

/** The signed cookie `miu-pagos`: the payments this browser made, for whichever instance answers next. */
export const cookieOverlay: PaymentOverlay = {
  async load(userId) {
    const saved = await readDemoCookie<Saved>(COOKIE);
    return saved?.k === "p" && saved.u === userId && Array.isArray(saved.p) ? saved.p : [];
  },
  async save(userId, payments) {
    await writeDemoCookie(
      COOKIE,
      { k: "p", u: userId, p: payments.slice(-KEEP) } satisfies Saved,
      TWELVE_HOURS,
    );
  },
};
