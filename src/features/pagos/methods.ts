import type { Quote } from "@/modules/payments";

export const METHOD_COPY: Record<Quote["metodo"], { titulo: string; detalle: string }> = {
  ach: {
    titulo: "Transferencia ACH",
    detalle: "Desde tu banco, en el checkout seguro de Recurrente. Se verifica sola en minutos.",
  },
  tarjeta: { titulo: "Tarjeta", detalle: "Visa o Mastercard, al instante." },
  apple_pay: {
    titulo: "Apple Pay",
    detalle: "Con la tarjeta guardada en tu teléfono, al instante.",
  },
};

/** What the pay button should say for a quote. */
export function payLabel(q: Pick<Quote, "metodo" | "total">, quetzales: (n: number) => string) {
  return `Pagar ${quetzales(q.total)} con ${q.metodo === "ach" ? "transferencia ACH" : q.metodo === "tarjeta" ? "tarjeta" : "Apple Pay"}`;
}
