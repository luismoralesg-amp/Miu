import type { PortResult } from "@/lib/result";
import type { Actor } from "@/modules/identity";

import type { AcademicDocument, DocumentKind } from "../domain/types";

/** Official academic documents (`real`: MiU registry). */
export interface DocumentsPort {
  listAcademicDocuments(
    actor: Actor,
    filter: { desde: string; hasta: string; q?: string },
  ): PortResult<AcademicDocument[]>;
  requestDocument(actor: Actor, tipo: DocumentKind): PortResult<AcademicDocument>;
}
