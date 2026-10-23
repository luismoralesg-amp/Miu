import type { CourseSlot } from "@/design-system/components";

/** Fictitious academic seed for the mock adapters (same data as docs/diseno/ronda3/assets/seed.js). */
export type CourseCode = "MD" | "PP" | "EL" | "BD";

export const COURSES: Record<
  CourseCode,
  {
    nombre: string;
    corto: string;
    slot: CourseSlot;
    catedratico: string;
    auxiliar: string | null;
    seccion: string;
  }
> = {
  MD: {
    nombre: "Matemática Discreta",
    corto: "Discreta",
    slot: 1,
    catedratico: "Jorge Castillo",
    auxiliar: "Sofía Ramírez",
    seccion: "A",
  },
  PP: {
    nombre: "Paradigmas de Programación",
    corto: "Paradigmas",
    slot: 2,
    catedratico: "Andrés Molina",
    auxiliar: "Carlos Méndez",
    seccion: "A",
  },
  EL: {
    nombre: "Ética de la Libertad",
    corto: "Ética",
    slot: 3,
    catedratico: "Lucía Herrera",
    auxiliar: null,
    seccion: "C",
  },
  BD: {
    nombre: "Bases de Datos I",
    corto: "Bases de Datos",
    slot: 4,
    catedratico: "Marta Juárez",
    auxiliar: "Diego Paz",
    seccion: "B",
  },
};

export const CLASSES: Array<{
  curso: CourseCode;
  dias: number[];
  ini: string;
  fin: string;
  salon: string;
}> = [
  { curso: "MD", dias: [1, 3, 4], ini: "07:00", fin: "08:20", salon: "D-307" },
  { curso: "PP", dias: [2, 4], ini: "09:00", fin: "10:20", salon: "D-210" },
  { curso: "BD", dias: [1, 3, 5], ini: "10:30", fin: "11:50", salon: "D-105" },
  { curso: "EL", dias: [1, 4], ini: "14:00", fin: "15:20", salon: "Auditorio Juan Bautista" },
];

export const EXAMS: Array<{
  id: string;
  curso: CourseCode;
  titulo: string;
  fecha: string;
  salon: string;
  peso: number;
}> = [
  {
    id: "x1",
    curso: "MD",
    titulo: "Parcial 2",
    fecha: "2026-10-23T07:00:00-06:00",
    salon: "D-307",
    peso: 20,
  },
  {
    id: "x2",
    curso: "PP",
    titulo: "Parcial 2",
    fecha: "2026-10-26T09:00:00-06:00",
    salon: "D-210",
    peso: 25,
  },
  {
    id: "x3",
    curso: "BD",
    titulo: "Parcial 2",
    fecha: "2026-10-27T10:30:00-06:00",
    salon: "D-105",
    peso: 25,
  },
  {
    id: "x4",
    curso: "EL",
    titulo: "Examen parcial",
    fecha: "2026-10-29T14:00:00-06:00",
    salon: "Auditorio Juan Bautista",
    peso: 20,
  },
];

export const ASSIGNMENTS: Array<{ id: string; curso: CourseCode; titulo: string; fecha: string }> =
  [
    { id: "e1", curso: "PP", titulo: "Ejercicio de llaves", fecha: "2026-10-23T23:59:00-06:00" },
    { id: "e2", curso: "MD", titulo: "Quiz 4: grafos", fecha: "2026-10-25T23:59:00-06:00" },
    {
      id: "e3",
      curso: "EL",
      titulo: "Lectura: Hayek, capítulo 3",
      fecha: "2026-10-26T08:00:00-06:00",
    },
    { id: "e4", curso: "BD", titulo: "Tarea 4: normalización", fecha: "2026-10-28T23:59:00-06:00" },
    { id: "e5", curso: "PP", titulo: "Proyecto: parser JSON", fecha: "2026-11-03T23:59:00-06:00" },
    {
      id: "e6",
      curso: "EL",
      titulo: "Ensayo: orden espontáneo",
      fecha: "2026-11-09T23:59:00-06:00",
    },
  ];

export const NEWS: Array<{
  id: string;
  tipo: "nota" | "documento" | "anuncio";
  curso: CourseCode;
  texto: string;
  quien: string;
  fecha: string;
  nueva: boolean;
}> = [
  {
    id: "n1",
    tipo: "nota",
    curso: "PP",
    texto: "92 en Actividad 5",
    quien: "Carlos Méndez, auxiliar",
    fecha: "2026-10-22T05:40:00-06:00",
    nueva: true,
  },
  {
    id: "n2",
    tipo: "documento",
    curso: "MD",
    texto: "Guía de repaso del Parcial 2",
    quien: "Jorge Castillo",
    fecha: "2026-10-21T17:10:00-06:00",
    nueva: true,
  },
  {
    id: "n3",
    tipo: "anuncio",
    curso: "EL",
    texto: "Traigan la lectura impresa el lunes",
    quien: "Lucía Herrera, catedrática",
    fecha: "2026-10-21T12:00:00-06:00",
    nueva: false,
  },
  {
    id: "n4",
    tipo: "nota",
    curso: "MD",
    texto: "90 en Quiz 3",
    quien: "Sofía Ramírez, auxiliar",
    fecha: "2026-10-20T19:00:00-06:00",
    nueva: true,
  },
];

export const PAYMENT = {
  concepto: "Cuota de noviembre",
  monto: 7387.8,
  vence: "2026-10-28T23:59:00-06:00",
};

export const PEOPLE: Array<{ nombre: string; rol: string }> = [
  { nombre: "Jorge Castillo", rol: "Catedrático · Discreta" },
  { nombre: "Sofía Ramírez", rol: "Auxiliar · Discreta" },
  { nombre: "Andrés Molina", rol: "Catedrático · Paradigmas" },
  { nombre: "Carlos Méndez", rol: "Auxiliar · Paradigmas" },
  { nombre: "Lucía Herrera", rol: "Catedrática · Ética" },
  { nombre: "Marta Juárez", rol: "Catedrática · Bases de Datos" },
];
