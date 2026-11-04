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

export type SettlementRow = { referencia: string; total: number; fecha: string };

/**
 * Matches what MiU recorded against what the provider settled, by reference: the same payment on
 * both sides (even with a different amount, which is flagged), only in MiU, or only at the provider.
 */
export function reconcile<A extends SettlementRow, B extends SettlementRow>(
  miu: A[],
  proveedor: B[],
) {
  const byRef = new Map(proveedor.map((r) => [r.referencia, r]));
  const conciliados: Array<{ miu: A; proveedor: B }> = [];
  const diferencias: Array<{ miu: A; proveedor: B }> = [];
  const soloMiu: A[] = [];
  for (const row of miu) {
    const other = byRef.get(row.referencia);
    if (!other) soloMiu.push(row);
    else if (cents(row.total) === cents(other.total))
      conciliados.push({ miu: row, proveedor: other });
    else diferencias.push({ miu: row, proveedor: other });
    byRef.delete(row.referencia);
  }
  return { conciliados, diferencias, soloMiu, soloProveedor: [...byRef.values()] };
}
