import { notConnected } from "@/lib/not-connected";

import type { DirectoryPort } from "../../ports/directory-port";

/** To connect: MiU's people directory (privacy-aware), the offices catalog and the events calendar. */
export const createRealDirectory = () => notConnected<DirectoryPort>("Directorio de MiU");
