import { selectAdapter } from "@/lib/adapters";
import { guarded } from "@/lib/result";

import { MockDocuments } from "./adapters/mock/mock-documents";
import { createRealDocuments } from "./adapters/real/real-documents";
import type { DocumentsPort } from "./ports/documents-port";

export type { DocumentsPort } from "./ports/documents-port";
export * from "./domain/types";

/** MIU_ADAPTER_DOCUMENTS=mock|real. */
export function documents(): DocumentsPort {
  return selectAdapter<DocumentsPort>("documents", {
    mock: () => guarded(new MockDocuments()),
    real: () => guarded(createRealDocuments()),
  });
}
