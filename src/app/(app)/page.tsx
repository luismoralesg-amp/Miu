import { academicNow, longDate } from "@/lib/clock";
import { roleLabel } from "@/modules/identity";
import { requireUser } from "@/modules/identity/session";

/** Hoy is built in E4. Until then this says so plainly instead of faking content. */
export default async function HoyPage() {
  const { user, rol } = await requireUser();
  const now = academicNow();
  const hora = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/Guatemala",
    }).format(now),
  );
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  const fecha = longDate(now);
  return (
    <div className="reveal py-10 md:py-14">
      <p className="text-[15px] text-fg-muted">
        {fecha.charAt(0).toUpperCase() + fecha.slice(1)} · {roleLabel[rol]}
      </p>
      <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium md:text-[64px]">
        {saludo}, {user.nombre}
      </h1>
      <p className="mt-6 max-w-[56ch] text-body text-fg-muted">
        La pantalla Hoy se construye en la etapa E4. Mientras tanto, la navegación, los avisos y el
        buscador ya funcionan.
      </p>
    </div>
  );
}
