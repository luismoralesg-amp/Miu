import { adapterKind } from "@/lib/adapters";
import { PEOPLE } from "@/mock/seed";

import type { Actor, Role, User } from "./domain/types";

const TYPE_FOR_ROLE: Record<Role, string> = {
  estudiante: "estudiante",
  maestro: "catedratico",
  auxiliar: "auxiliar",
  administrativo: "administrativo",
};

/** Seed person each role falls back to, so any test account sees a complete record. */
const DEFAULT_PERSON: Record<Role, string> = {
  estudiante: "p-ana",
  maestro: "p-jorge",
  auxiliar: "p-carlos",
  administrativo: "p-rodrigo",
};

/**
 * Maps a signed-in user to the academic person they act as. With the real identity adapter the user
 * id is the person id. In the mock, a seeded user acts as their own person when the role matches;
 * any other account (E2E test users, the role switcher) acts as the seed person of that role.
 */
export function actorFor(user: User, role: Role): Actor {
  const nombre = `${user.nombre} ${user.apellido}`;
  if (adapterKind("identity") === "real")
    return { userId: user.id, personId: user.id, role, nombre };
  const own = PEOPLE.find((p) => p.userId === user.id && p.tipo === TYPE_FOR_ROLE[role]);
  return { userId: user.id, personId: own?.id ?? DEFAULT_PERSON[role], role, nombre };
}
