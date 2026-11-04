export type Band = { id: string; label: string; min: number; max: number; count: number };

/**
 * How a section's current grades are spread: under the threshold, then up to each goal, then the top
 * band (threshold 61, goals 71/80/90 [S]). Every grade lands in exactly one band.
 */
export function distribution(grades: number[], umbral: number, metas: readonly number[]): Band[] {
  const edges = [0, umbral, ...metas, 101];
  const bands = edges.slice(0, -1).map((min, i): Band => {
    const max = (edges[i + 1] as number) - 1;
    const label =
      i === 0 ? `Bajo ${umbral}` : i === edges.length - 2 ? `${min} o más` : `${min} a ${max}`;
    return { id: `b${i}`, label, min, max, count: 0 };
  });
  for (const g of grades) {
    const band = bands.find((b) => g >= b.min && g <= b.max) ?? bands[bands.length - 1]!;
    band.count++;
  }
  return bands;
}
