import { selectAdapter } from "@/lib/adapters";
import { guarded } from "@/lib/result";

import { MockStorage } from "./adapters/mock/mock-storage";
import { createRealStorage } from "./adapters/real/real-storage";
import type { StoragePort } from "./ports/storage-port";

export type { StoragePort } from "./ports/storage-port";
export * from "./domain/types";

/** MIU_ADAPTER_STORAGE=mock|real. */
export function storage(): StoragePort {
  return selectAdapter<StoragePort>("storage", {
    mock: () => guarded(new MockStorage()),
    real: () => guarded(createRealStorage()),
  });
}
