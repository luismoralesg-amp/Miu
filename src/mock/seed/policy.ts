import { day } from "./time";

/**
 * Institutional rules that the Administrativo can change (E11). Every value here is an assumption [S]
 * until the UFM confirms it; see docs/INTEGRACIONES_PENDIENTES.md.
 */
export const POLICY = {
  /** Under this grade the grader must write a justification [S]. */
  umbralJustificacion: 61,
  /** Targets shown on Notas [S]. */
  metas: [71, 80, 90] as number[],
  /** Card and Apple Pay fee charged by Recurrente, paid by the payer [S, pending UFM]. */
  comisionTarjeta: {
    porcentaje: 4.5,
    fijo: 2,
    pagador: "estudiante" as "estudiante" | "universidad",
  },
  /** ACH has no fee. */
  comisionAch: 0,
  /** Banks offered by Recurrente's ACH checkout [S]. */
  bancosAch: ["BI", "BAC", "Banrural", "G&T"],
  /** Exam week is a property of the academic calendar; here the seed decides it [S]. */
  semanaExamenes: { desde: day(4), hasta: day(8) },
  /** Only the teacher closes the final grade unless the Administrativo grants it [S]. */
  cierreNotaFinal: "maestro" as "maestro" | "maestro_y_auxiliar",
};
