import { notConnected } from "@/lib/not-connected";

import type { DocumentsPort } from "../../ports/documents-port";

/** To connect: the registrar's document service (issue, sign, verification code). */
export const createRealDocuments = () =>
  notConnected<DocumentsPort>("Registro académico de la UFM");
