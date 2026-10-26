import { notConnected } from "@/lib/not-connected";

import type { LedgerPort, SolvencyPort } from "../../ports/ledger-port";

/**
 * To connect: the UFM's financial system for charges, receipts, statements and solvency, and a write
 * path for settled payments and reviewed transfers. Until then every method answers `unavailable`.
 */
export const createRealLedger = () =>
  notConnected<LedgerPort & SolvencyPort>("Sistema financiero de la UFM");
