import { selectAdapter } from "@/lib/adapters";
import { guarded } from "@/lib/result";

import { MockLedger } from "./adapters/mock/mock-ledger";
import { createRealLedger } from "./adapters/real/real-ledger";
import type { LedgerPort, SolvencyPort } from "./ports/ledger-port";

export type { LedgerPort, SolvencyPort } from "./ports/ledger-port";
export * from "./domain/types";
export { cents, isSolventFrom, reconcile, runningStatement } from "./domain/rules";
export type { SettlementRow } from "./domain/rules";

/** MIU_ADAPTER_LEDGER=mock|real. One adapter answers both the ledger and solvency. */
export function ledger(): LedgerPort & SolvencyPort {
  return selectAdapter<LedgerPort & SolvencyPort>("ledger", {
    mock: () => guarded(new MockLedger()),
    real: () => guarded(createRealLedger()),
  });
}
