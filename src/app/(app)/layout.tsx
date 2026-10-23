import { cookies } from "next/headers";

import { THEME_COOKIE, parseTheme } from "@/design-system/theme/theme";
import { devToolsEnabled, requireUser } from "@/modules/identity/session";
import { AppShell } from "@/shell/app-shell";
import { buildCommands, buildNotifications } from "@/shell/data";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, rol } = await requireUser();
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <AppShell
      nombre={`${user.nombre} ${user.apellido}`}
      correo={user.correo}
      rol={rol}
      theme={theme}
      commands={buildCommands(rol)}
      notifications={buildNotifications(rol)}
      devTools={devToolsEnabled()}
    >
      {children}
    </AppShell>
  );
}
