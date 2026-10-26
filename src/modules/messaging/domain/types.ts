import { z } from "zod";

export const Message = z.object({
  id: z.string(),
  de: z.enum(["yo", "otro"]),
  texto: z.string(),
  fecha: z.string(),
});
export type Message = z.infer<typeof Message>;

export const ThreadSummary = z.object({
  personaId: z.string(),
  nombre: z.string(),
  rol: z.string(),
  ultimo: z.string(),
  fecha: z.string(),
  noLeidos: z.number().int(),
});
export type ThreadSummary = z.infer<typeof ThreadSummary>;

export const Thread = z.object({
  persona: z.object({ id: z.string(), nombre: z.string(), rol: z.string() }),
  mensajes: z.array(Message),
});
export type Thread = z.infer<typeof Thread>;

export const SendInput = z.object({
  texto: z.string().trim().min(1, "Escribe un mensaje").max(2000, "Máximo 2000 caracteres"),
});
