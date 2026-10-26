/**
 * Fictitious people only. Nobody here is a real student or teacher; names are generic combinations and
 * every carné is invented. Login users map to identity's mock users through `userId`.
 */
export type SeedPerson = {
  id: string;
  nombre: string;
  apellido: string;
  /** Identity user that signs in as this person, if any. */
  userId?: string;
  correo: string;
  tipo: "estudiante" | "catedratico" | "auxiliar" | "administrativo";
  /** Title shown next to the name, written in the seed (never inferred from the name). */
  cargo?: string;
  carne?: string;
};

export const STAFF: SeedPerson[] = [
  {
    id: "p-jorge",
    nombre: "Jorge",
    apellido: "Castillo",
    userId: "u-jorge",
    correo: "jorge.castillo.demo@ufm.edu",
    tipo: "catedratico",
    cargo: "Catedrático",
  },
  {
    id: "p-andres",
    nombre: "Andrés",
    apellido: "Molina",
    correo: "andres.molina.demo@ufm.edu",
    tipo: "catedratico",
    cargo: "Catedrático",
  },
  {
    id: "p-lucia",
    nombre: "Lucía",
    apellido: "Herrera",
    correo: "lucia.herrera.demo@ufm.edu",
    tipo: "catedratico",
    cargo: "Catedrática",
  },
  {
    id: "p-marta",
    nombre: "Marta",
    apellido: "Juárez",
    correo: "marta.juarez.demo@ufm.edu",
    tipo: "catedratico",
    cargo: "Catedrática",
  },
  {
    id: "p-carlos",
    nombre: "Carlos",
    apellido: "Méndez",
    userId: "u-carlos",
    correo: "carlos.mendez.demo@ufm.edu",
    tipo: "auxiliar",
    cargo: "Auxiliar",
  },
  {
    id: "p-sofia",
    nombre: "Sofía",
    apellido: "Ramírez",
    userId: "u-sofia",
    correo: "sofia.ramirez.demo@ufm.edu",
    tipo: "auxiliar",
    cargo: "Auxiliar",
  },
  {
    id: "p-diego",
    nombre: "Diego",
    apellido: "Paz",
    correo: "diego.paz.demo@ufm.edu",
    tipo: "auxiliar",
    cargo: "Auxiliar",
  },
  {
    id: "p-rodrigo",
    nombre: "Rodrigo",
    apellido: "Ajú",
    userId: "u-rodrigo",
    correo: "rodrigo.aju.demo@ufm.edu",
    tipo: "administrativo",
    cargo: "Finanzas estudiantiles",
  },
  {
    id: "p-paola",
    nombre: "Paola",
    apellido: "Sic",
    correo: "paola.sic.demo@ufm.edu",
    tipo: "administrativo",
    cargo: "Finanzas estudiantiles",
  },
];

/** The demo student. Every student account in the mock sees her academic record. */
export const STUDENT: SeedPerson & {
  carrera: string;
  semestre: number;
  ingreso: string;
} = {
  id: "p-ana",
  nombre: "Ana",
  apellido: "López",
  userId: "u-ana",
  correo: "ana.lopez.demo@ufm.edu",
  tipo: "estudiante",
  carne: "2024-0187",
  carrera: "Ciencias de la Computación",
  semestre: 5,
  ingreso: "2024-2",
};

const FIRST = [
  "Andrea",
  "Bruno",
  "Camila",
  "Daniel",
  "Elena",
  "Fernando",
  "Gabriela",
  "Héctor",
  "Irene",
  "Julián",
  "Karen",
  "Lorenzo",
  "Mariela",
  "Nicolás",
  "Olga",
  "Pablo",
  "Raquel",
  "Samuel",
  "Tatiana",
  "Ulises",
  "Valeria",
  "Walter",
  "Ximena",
  "Zoe",
  "Adrián",
  "Beatriz",
  "Cristian",
  "Diana",
];
const LAST = [
  "Batz",
  "Chávez",
  "Díaz",
  "Estrada",
  "Figueroa",
  "García",
  "Hernández",
  "Ixcot",
  "Jocol",
  "Kestler",
  "Lemus",
  "Monzón",
  "Navas",
  "Orellana",
  "Pineda",
  "Quiñónez",
  "Rosales",
  "Sandoval",
  "Toledo",
  "Urízar",
  "Véliz",
  "Xajil",
  "Yat",
  "Zelada",
  "Barrios",
  "Cifuentes",
  "Dávila",
  "Escobar",
];

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** 56 classmates from two fixed pools: same order, same carnés, every run. */
export const CLASSMATES: SeedPerson[] = [0, 11].flatMap((shift, pool) =>
  FIRST.map((nombre, i) => {
    const apellido = LAST[(i + shift) % LAST.length]!;
    return {
      id: `p-s${pool}${String(i).padStart(2, "0")}`,
      nombre,
      apellido,
      correo: `${slug(nombre)}.${slug(apellido)}.demo@ufm.edu`,
      tipo: "estudiante" as const,
      carne: `${pool === 0 ? 2024 : 2025}-${String(112 + i * 7 + pool * 3).padStart(4, "0")}`,
    };
  }),
);

export const PEOPLE: SeedPerson[] = [STUDENT, ...STAFF, ...CLASSMATES];

export function personById(id: string): SeedPerson | undefined {
  return PEOPLE.find((p) => p.id === id);
}

export const fullName = (p: Pick<SeedPerson, "nombre" | "apellido">) => `${p.nombre} ${p.apellido}`;
