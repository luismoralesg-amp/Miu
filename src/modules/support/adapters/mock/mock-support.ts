import { z } from "zod";

import { academicNow } from "@/lib/clock";
import { parsed } from "@/lib/contract";
import { fail } from "@/lib/result";
import { buildSeed, type Seed } from "@/mock/seed";
import type { Actor } from "@/modules/identity";

import { ChatContext, ChatSession, Faq, departmentLabel } from "../../domain/types";
import type { SupportChatPort } from "../../ports/support-port";

const FAQ: z.infer<typeof Faq>[] = [
  {
    id: "f1",
    tema: "Pagos",
    pregunta: "¿Cuál es la forma más barata de pagar?",
    respuesta:
      "La transferencia ACH no tiene comisión. Con tarjeta o Apple Pay se suma la comisión del procesador.",
    href: "/pagos",
  },
  {
    id: "f2",
    tema: "Pagos",
    pregunta: "Subí un comprobante, ¿cuándo se refleja?",
    respuesta:
      "Finanzas lo revisa en 1 a 2 días hábiles. Mientras tanto el cargo aparece en revisión y no cuenta contra tu solvencia.",
    href: "/pagos",
  },
  {
    id: "f3",
    tema: "Cursos",
    pregunta: "¿Cómo sé que mi entrega llegó?",
    respuesta:
      "Al entregar recibes un recibo con la hora y la huella SHA-256 del archivo. Queda visible en la actividad.",
    href: "/cursos",
  },
  {
    id: "f4",
    tema: "Cuenta",
    pregunta: "No reconozco un acceso a mi cuenta",
    respuesta:
      "Cierra esa sesión desde Dispositivos y cambia tu correo de recuperación con Soporte.",
    href: "/cuenta/dispositivos",
  },
  {
    id: "f5",
    tema: "Notas",
    pregunta: "¿Puedo pedir que revisen una nota?",
    respuesta:
      "Sí. Desde la actividad calificada puedes apelar con un motivo; responde primero el auxiliar y luego el catedrático.",
    href: "/notas",
  },
  {
    id: "f6",
    tema: "Asignación",
    pregunta: "¿Gana quien se asigna primero?",
    respuesta: "No. Las preferencias se resuelven por lote al cerrar la ventana, todas a la vez.",
    href: "/asignacion",
  },
];

/** Canned agent replies: enough to show the flow without pretending to be a person. */
export class MockSupport implements SupportChatPort {
  private readonly sessions = new Map<
    string,
    { owner: string; session: z.infer<typeof ChatSession> }
  >();

  constructor(
    private readonly seed: Seed = buildSeed(),
    private readonly now: () => Date = academicNow,
  ) {}

  async listFaq() {
    return parsed(z.array(Faq), FAQ);
  }

  async openSession(actor: Actor, context: z.input<typeof ChatContext>) {
    const ctx = ChatContext.safeParse(context);
    if (!ctx.success) return fail("invalid", "Elige un departamento");
    const p = this.seed.people.find((x) => x.id === actor.personId);
    const id = `chat-${this.sessions.size + 1}`;
    const session = {
      id,
      departamento: ctx.data.departamento,
      contexto: {
        nombre: actor.nombre,
        carne: p?.carne ?? "—",
        rol: actor.role,
        pantalla: ctx.data.pantalla || "/soporte",
      },
      mensajes: [
        {
          de: "soporte" as const,
          texto: `Hola, ${actor.nombre.split(" ")[0]}. Estás con ${departmentLabel[ctx.data.departamento]} (respuesta automática de la demo). Ya vemos tu cuenta y que venías de ${ctx.data.pantalla || "Soporte"}; cuéntanos qué pasó.`,
          fecha: this.now().toISOString(),
        },
      ],
    };
    this.sessions.set(id, { owner: actor.userId, session });
    return parsed(ChatSession, session);
  }

  async send(actor: Actor, sessionId: string, texto: string) {
    const s = this.sessions.get(sessionId);
    if (!s || s.owner !== actor.userId) return fail("not_found");
    const t = texto.trim();
    if (!t) return fail("invalid", "Escribe tu mensaje");
    const fecha = this.now().toISOString();
    s.session.mensajes.push({ de: "yo", texto: t.slice(0, 1000), fecha });
    s.session.mensajes.push({
      de: "soporte",
      texto:
        "Gracias, lo registramos con el número de este chat. Te respondemos aquí y por correo.",
      fecha,
    });
    return parsed(ChatSession, s.session);
  }
}
