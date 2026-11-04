import type { PortResult } from "@/lib/result";
import type { Actor } from "@/modules/identity";

import type { CampusEvent, DirectoryEntry, Office } from "../domain/types";

/** People, offices and events (`real`: MiU directory, respecting each person's privacy choice). */
export interface DirectoryPort {
  /** At least 3 characters; students appear only if they chose to. */
  searchPeople(actor: Actor, query: string): PortResult<DirectoryEntry[]>;
  listOffices(): PortResult<Office[]>;
  listEvents(): PortResult<CampusEvent[]>;
}
