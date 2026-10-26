import type { Role } from "@/modules/identity";

import { NAV, SECTIONS, type IconName, type SectionKey } from "./navigation";

export type CommandGroup =
  "Acciones" | "Cursos" | "Actividades" | "Pagos" | "Secciones" | "Personas";

export type CommandItem = {
  id: string;
  grupo: CommandGroup;
  titulo: string;
  detalle: string;
  href: string;
  icono?: IconName;
  curso?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Extra words that should match (synonyms, verbs). */
  palabras?: string;
  externo?: boolean;
};

export const GROUP_ORDER: CommandGroup[] = [
  "Acciones",
  "Cursos",
  "Actividades",
  "Pagos",
  "Secciones",
  "Personas",
];

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** Every word of the query must appear; titles that start with the query rank first. */
export function filterCommands(items: CommandItem[], query: string): CommandItem[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return GROUP_ORDER.flatMap((g) =>
      items.filter((i) => i.grupo === g).slice(0, g === "Acciones" ? 6 : 3),
    );
  }
  const q = normalize(query.trim());
  return GROUP_ORDER.flatMap((g) =>
    items
      .filter((i) => i.grupo === g)
      .filter((i) => {
        const hay = normalize(`${i.titulo} ${i.detalle} ${i.palabras ?? ""} ${i.grupo}`);
        return words.every((w) => hay.includes(w));
      })
      .sort(
        (a, b) =>
          Number(normalize(b.titulo).startsWith(q)) - Number(normalize(a.titulo).startsWith(q)),
      )
      .slice(0, 8),
  );
}

/** Every section the role can reach from the bar or "Más". */
export function sectionCommands(role: Role): CommandItem[] {
  const nav = NAV[role];
  const keys: SectionKey[] = [...new Set([...nav.barra, ...nav.mas.flatMap(([, k]) => k)])];
  return keys.map((k) => {
    const s = SECTIONS[k];
    return {
      id: `s-${k}`,
      grupo: "Secciones",
      titulo: s.titulo,
      detalle: s.descripcion,
      href: s.path,
      icono: s.icono,
      ...(s.externo ? { externo: true } : {}),
    };
  });
}
