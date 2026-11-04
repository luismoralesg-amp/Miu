import { z } from "zod";

import { parsed } from "@/lib/contract";
import { fail } from "@/lib/result";
import { at, buildSeed, fullName, type Seed } from "@/mock/seed";
import type { Actor } from "@/modules/identity";

import { CampusEvent, DirectoryEntry, MIN_QUERY, Office } from "../../domain/types";
import type { DirectoryPort } from "../../ports/directory-port";

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** Example offices and events [S]: names, phones and rooms are placeholders. */
const OFFICES: z.infer<typeof Office>[] = [
  {
    id: "o1",
    nombre: "Registro académico",
    ubicacion: "Edificio Académico, nivel 1",
    telefono: "2338-0000 ext. 101",
    correo: "registro.demo@ufm.edu",
    horario: "Lunes a viernes, 07:00 a 17:00",
  },
  {
    id: "o2",
    nombre: "Finanzas estudiantiles",
    ubicacion: "Edificio Académico, nivel 1",
    telefono: "2338-0000 ext. 120",
    correo: "finanzas.demo@ufm.edu",
    horario: "Lunes a viernes, 07:00 a 17:00",
  },
  {
    id: "o3",
    nombre: "Tecnología y soporte",
    ubicacion: "Biblioteca, nivel 2",
    telefono: "2338-0000 ext. 200",
    correo: "soporte.demo@ufm.edu",
    horario: "Lunes a sábado, 07:00 a 20:00",
  },
  {
    id: "o4",
    nombre: "Biblioteca",
    ubicacion: "Biblioteca, nivel 1",
    telefono: "2338-0000 ext. 300",
    correo: "biblioteca.demo@ufm.edu",
    horario: "Lunes a sábado, 07:00 a 21:00",
  },
];
const EVENTS: z.infer<typeof CampusEvent>[] = [
  {
    id: "ev1",
    titulo: "Feria de empleo de Computación",
    fecha: at(2, "10:00"),
    lugar: "Plaza central",
    tipo: "Feria",
  },
  {
    id: "ev2",
    titulo: "Concierto de la orquesta estudiantil",
    fecha: at(8, "19:00"),
    lugar: "Auditorio Juan Bautista",
    tipo: "Cultura",
  },
  {
    id: "ev3",
    titulo: "Torneo interfacultades de fútbol",
    fecha: at(10, "08:00"),
    lugar: "Canchas",
    tipo: "Deporte",
  },
];

export class MockDirectory implements DirectoryPort {
  constructor(private readonly seed: Seed = buildSeed()) {}

  async searchPeople(_actor: Actor, query: string) {
    const q = fold(query.trim());
    if (q.length < MIN_QUERY) return fail("invalid", `Escribe al menos ${MIN_QUERY} letras`);
    // Staff are listed; students only when they opted in (every third classmate in the demo) [S].
    const visible = this.seed.people.filter(
      (p, i) => p.tipo !== "estudiante" || (p.id !== "p-ana" && i % 3 === 0),
    );
    return parsed(
      z.array(DirectoryEntry),
      visible
        .filter((p) => fold(fullName(p)).includes(q))
        .slice(0, 20)
        .map((p) => ({
          id: p.id,
          nombre: fullName(p),
          rol: p.cargo ?? "Estudiante",
          correo: p.correo,
        })),
    );
  }

  async listOffices() {
    return parsed(z.array(Office), OFFICES);
  }

  async listEvents() {
    return parsed(z.array(CampusEvent), EVENTS);
  }
}
