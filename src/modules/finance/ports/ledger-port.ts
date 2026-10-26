import type { PortResult } from "@/lib/result";
import type { Actor } from "@/modules/identity";

import type {
  Balance,
  Charge,
  QueuedTransfer,
  Receipt,
  SettledPayment,
  Solvency,
  Statement,
  TransferInput,
} from "../domain/types";

/** The student's account at the university (`real`: the UFM's financial system). */
export interface LedgerPort {
  getBalance(actor: Actor): PortResult<Balance>;
  listCharges(actor: Actor): PortResult<Charge[]>;
  getCharge(actor: Actor, chargeId: string): PortResult<Charge>;
  listReceipts(actor: Actor): PortResult<Receipt[]>;
  getStatement(actor: Actor, range: { desde: string; hasta: string }): PortResult<Statement>;
  /** Records a payment the provider confirmed (called by the webhook, never by a page). */
  settle(payment: SettledPayment): PortResult<Receipt>;
  /** Transfer with a receipt: goes to the Administrativo's queue, the charge shows "en revisión". */
  submitTransfer(actor: Actor, input: TransferInput): PortResult<Receipt>;
  listTransferQueue(actor: Actor): PortResult<QueuedTransfer[]>;
  reviewTransfer(
    actor: Actor,
    transferId: string,
    decision: { aprobar: boolean; motivo?: string },
  ): PortResult<QueuedTransfer>;
}

/** Solvency is a separate question other systems ask (enrollment, documents). */
export interface SolvencyPort {
  isSolvent(actor: Actor): PortResult<Solvency>;
}
