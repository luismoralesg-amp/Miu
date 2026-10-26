import { EyeOff, Inbox } from "lucide-react";

import { EmptyState } from "@/design-system/components";
import { subsectionLabel, type Subsection } from "@/modules/academic";

import { EMPTY_COPY } from "./subsection-copy";

/** "Off" and "empty" look and read differently, because they mean different things. */
export function DisabledSubsection({ sub }: { sub: Subsection }) {
  return (
    <div className="border-y border-border">
      <EmptyState
        reason="disabled"
        icon={<EyeOff aria-hidden="true" />}
        title={`${subsectionLabel[sub]} no está habilitado en este curso`}
        description="El catedrático decidió no usar esta sección. Si necesitas algo de aquí, escríbele desde Personas."
      />
    </div>
  );
}

export function EmptySubsection({ sub }: { sub: Subsection }) {
  return (
    <div className="border-y border-border">
      <EmptyState icon={<Inbox aria-hidden="true" />} {...EMPTY_COPY[sub]} />
    </div>
  );
}
