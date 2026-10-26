import { cookies } from "next/headers";

import { THEME_COOKIE, parseTheme } from "@/design-system/theme/theme";
import { academicNow } from "@/lib/clock";
import { devToolsEnabled, requireActor } from "@/modules/identity/session";
import { inbox } from "@/modules/inbox";
import { AppShell } from "@/shell/app-shell";
import { buildCommands } from "@/shell/data";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor();
  const { user, rol } = actor.user;
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  const box = await inbox().listItems(actor);
  return (
    <AppShell
      nombre={`${user.nombre} ${user.apellido}`}
      correo={user.correo}
      rol={rol}
      theme={theme}
      commands={buildCommands(rol)}
      inbox={box.ok ? box.value.items : []}
      now={academicNow().toISOString()}
      devTools={devToolsEnabled()}
    >
      {children}
    </AppShell>
  );
}
