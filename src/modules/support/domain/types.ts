import { z } from "zod";

export const Department = z.enum(["registro", "finanzas", "tecnologia"]);
export type Department = z.infer<typeof Department>;
export const departmentLabel: Record<Department, string> = {
  registro: "Registro académico",
  finanzas: "Finanzas estudiantiles",
  tecnologia: "Tecnología (MiU, correo, Wi-Fi)",
};

export const ChatContext = z.object({
  departamento: Department,
  /** Screen the person came from, so nobody has to explain where they were. */
  pantalla: z.string().max(200),
});

export const ChatMessage = z.object({
  de: z.enum(["yo", "soporte"]),
  texto: z.string(),
  fecha: z.string(),
});
export const ChatSession = z.object({
  id: z.string(),
  departamento: Department,
  /** What the agent sees before the first message. */
  contexto: z.object({
    nombre: z.string(),
    carne: z.string(),
    rol: z.string(),
    pantalla: z.string(),
  }),
  mensajes: z.array(ChatMessage),
});
export type ChatSession = z.infer<typeof ChatSession>;

export const Faq = z.object({
  id: z.string(),
  pregunta: z.string(),
  respuesta: z.string(),
  tema: z.string(),
  href: z.string().optional(),
});
export type Faq = z.infer<typeof Faq>;
