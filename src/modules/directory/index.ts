import { selectAdapter } from "@/lib/adapters";
import { guarded } from "@/lib/result";

import { MockDirectory } from "./adapters/mock/mock-directory";
import { createRealDirectory } from "./adapters/real/real-directory";
import type { DirectoryPort } from "./ports/directory-port";

export type { DirectoryPort } from "./ports/directory-port";
export * from "./domain/types";

/** MIU_ADAPTER_DIRECTORY=mock|real. */
export function directory(): DirectoryPort {
  return selectAdapter<DirectoryPort>("directory", {
    mock: () => guarded(new MockDirectory()),
    real: () => guarded(createRealDirectory()),
  });
}
