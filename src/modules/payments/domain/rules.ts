import type { FeePolicy, ProviderMethod, Quote } from "./types";

const cents = (n: number) => Math.round(n * 100) / 100;

/** Provider fee: ACH has none; card and Apple Pay pay a percentage plus a fixed amount. */
export function fee(monto: number, metodo: ProviderMethod, policy: FeePolicy) {
  if (metodo === "ach") return 0;
  return cents((monto * policy.porcentaje) / 100 + policy.fijo);
}

/** Quote for one method. When the payer bears the fee, it is added to the total [S]. */
export function quote(
  monto: number,
  metodo: ProviderMethod,
  policy: FeePolicy,
): Omit<Quote, "ahorro"> {
  const comision = fee(monto, metodo, policy);
  return {
    metodo,
    monto,
    comision,
    total: policy.pagador === "estudiante" ? cents(monto + comision) : monto,
    pagador: policy.pagador,
  };
}

const ORDER: ProviderMethod[] = ["ach", "tarjeta", "apple_pay"];

/**
 * Routing by cost: every method sorted from cheapest to most expensive for the payer, with the saving
 * against the most expensive one. ACH comes first and shows what it saves.
 */
export function routeByCost(monto: number, policy: FeePolicy): Quote[] {
  const quotes = ORDER.map((m) => quote(monto, m, policy));
  const max = Math.max(...quotes.map((q) => q.total));
  return quotes
    .map((q) => ({ ...q, ahorro: cents(max - q.total) }))
    .sort((a, b) => a.total - b.total || ORDER.indexOf(a.metodo) - ORDER.indexOf(b.metodo));
}
