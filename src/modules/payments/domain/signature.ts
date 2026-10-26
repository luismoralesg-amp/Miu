import { createHmac, timingSafeEqual } from "node:crypto";

/** HMAC-SHA256 of the raw webhook body, hex encoded (`x-recurrente-signature` in the mock). */
export function sign(body: string, secret: string) {
  return createHmac("sha256", secret).update(body).digest("hex");
}

/** Constant-time comparison, so the check does not leak how much of the signature matched. */
export function verifySignature(body: string, signature: string | null, secret: string) {
  if (!signature || !/^[0-9a-f]{64}$/.test(signature)) return false;
  return timingSafeEqual(Buffer.from(sign(body, secret), "hex"), Buffer.from(signature, "hex"));
}
