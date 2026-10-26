import { createHash } from "node:crypto";

import { BLOCKED_EXTENSIONS, MAX_UPLOAD_BYTES } from "./types";

/** SHA-256 of the exact bytes, hex: the fingerprint printed on the submission receipt. */
export function sha256Hex(bytes: Uint8Array | string) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function extensionOf(nombre: string) {
  const i = nombre.lastIndexOf(".");
  return i > 0 ? nombre.slice(i + 1).toLowerCase() : "";
}

/** Why a file cannot be accepted, or null. Checked before storing anything. */
export function rejectReason(nombre: string, tamano: number): string | null {
  if (tamano === 0) return "El archivo está vacío";
  if (tamano > MAX_UPLOAD_BYTES) return "El archivo pesa más de 10 MB";
  if (BLOCKED_EXTENSIONS.includes(extensionOf(nombre)))
    return "Ese tipo de archivo no se acepta por seguridad";
  return null;
}

/** The EICAR test string: antivirus engines flag it on purpose, so the scan path can be tested. */
const EICAR = "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";

export function looksInfected(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("latin1").includes(EICAR);
}
