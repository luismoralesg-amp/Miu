import { realNow } from "@/lib/clock";
import { identity } from "@/modules/identity";
import { requireUser } from "@/modules/identity/session";

import { DeviceList } from "./device-list";

export const metadata = { title: "Accesos y dispositivos" };

export default async function DevicesPage() {
  const { user, session } = await requireUser();
  const devices = await identity().listDevices(user.id);
  return (
    <div className="py-10 md:py-14">
      <p className="text-[15px] text-fg-muted">Mi cuenta</p>
      <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium md:text-[56px]">
        Accesos y dispositivos
      </h1>
      <p className="mt-3 max-w-[60ch] text-body text-fg-muted">
        Aquí ves dónde tienes sesión abierta. Si no reconoces un dispositivo, ciérralo: tendrá que
        volver a entrar con tu correo.
      </p>
      <DeviceList
        devices={devices.map((d) => ({ ...d, actual: d.id === session.deviceId }))}
        ahora={realNow()}
      />
    </div>
  );
}
