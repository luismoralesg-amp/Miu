import { payments } from "@/modules/payments";

const STATUS = {
  forbidden: 401,
  invalid: 400,
  not_found: 404,
  timeout: 504,
  unavailable: 503,
} as const;

/**
 * Recurrente's webhook. The raw body is verified against `x-recurrente-signature` before anything is
 * parsed; a repeated event answers 200 without settling the charge twice.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const result = await payments().handleWebhook(
    body,
    request.headers.get("x-recurrente-signature"),
  );
  if (result.ok) return Response.json(result.value);
  return Response.json({ error: result.error }, { status: STATUS[result.error] });
}
