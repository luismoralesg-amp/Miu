/** Money is kept in quetzales with two decimals; every sum is rounded to the cent. */
export const cents = (n: number) => Math.round(n * 100) / 100;

/**
 * Running statement: charges add, payments subtract, sorted by date. Starts from `saldoInicial`.
 */
export function runningStatement(
  lines: Array<{ fecha: string; concepto: string; cargo: number | null; abono: number | null }>,
  saldoInicial = 0,
) {
  let saldo = saldoInicial;
  return [...lines]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((l) => {
      saldo = cents(saldo + (l.cargo ?? 0) - (l.abono ?? 0));
      return { ...l, saldo };
    });
}

/** Solvent = nothing overdue. A charge in review does not count against the student. */
export function isSolventFrom(charges: Array<{ estado: string; diasParaVencer: number }>) {
  return !charges.some((c) => c.estado === "pendiente" && c.diasParaVencer < 0);
}
