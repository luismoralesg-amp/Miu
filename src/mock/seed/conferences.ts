import { at } from "./time";

/** Fictitious talks; rooms and speakers are examples [S]. */
export type SeedConference = {
  id: string;
  titulo: string;
  ponente: string;
  fecha: string;
  duracionMin: number;
  lugar: string;
  cupo: number;
  inscritos: number;
  descripcion: string;
};

export const CONFERENCES: SeedConference[] = [
  {
    id: "conocimiento-disperso",
    titulo: "Mercados y conocimiento disperso",
    ponente: "Elena Ortiz",
    fecha: at(1, "18:00"),
    duracionMin: 90,
    lugar: "Auditorio Juan Bautista",
    cupo: 120,
    inscritos: 87,
    descripcion: "Cómo los precios coordinan lo que nadie sabe por completo.",
  },
  {
    id: "etica-ia",
    titulo: "Ética en la inteligencia artificial",
    ponente: "Tomás Rivas",
    fecha: at(5, "17:00"),
    duracionMin: 60,
    lugar: "Salón Q-201",
    cupo: 60,
    inscritos: 60,
    descripcion: "Responsabilidad, sesgos y decisiones automáticas.",
  },
  {
    id: "emprender",
    titulo: "Emprender desde la universidad",
    ponente: "Lorena Díaz",
    fecha: at(12, "12:30"),
    duracionMin: 60,
    lugar: "Salón Q-105",
    cupo: 80,
    inscritos: 31,
    descripcion: "Tres fundadores cuentan su primer año.",
  },
  {
    id: "historia-moneda",
    titulo: "Historia de la moneda",
    ponente: "Andrés Polo",
    fecha: at(-3, "18:00"),
    duracionMin: 90,
    lugar: "Auditorio Juan Bautista",
    cupo: 120,
    inscritos: 101,
    descripcion: "Del trueque al dinero digital.",
  },
  {
    id: "arte-orden",
    titulo: "Arte y orden espontáneo",
    ponente: "Clara Méndez",
    fecha: at(-20, "18:00"),
    duracionMin: 60,
    lugar: "Salón Q-201",
    cupo: 60,
    inscritos: 44,
    descripcion: "La forma que nadie diseñó.",
  },
  {
    id: "derecho-libertad",
    titulo: "Derecho y libertad",
    ponente: "Rafael Soto",
    fecha: at(-10, "18:00"),
    duracionMin: 60,
    lugar: "Salón Q-105",
    cupo: 80,
    inscritos: 72,
    descripcion: "La ley como descubrimiento.",
  },
];

export type SeedReservation = {
  conferenceId: string;
  estado: "reservada" | "en_espera";
  posicion?: number;
  asistio?: boolean;
  evaluacion?: { calificacion: number; comentario: string };
};

/** The demo student's reservations: one ahead, one attended to evaluate, one evaluated, one missed. */
export const RESERVATIONS: SeedReservation[] = [
  { conferenceId: "emprender", estado: "reservada" },
  { conferenceId: "historia-moneda", estado: "reservada", asistio: true },
  {
    conferenceId: "arte-orden",
    estado: "reservada",
    asistio: true,
    evaluacion: { calificacion: 5, comentario: "Clara y con buenos ejemplos." },
  },
  { conferenceId: "derecho-libertad", estado: "reservada", asistio: false },
];
