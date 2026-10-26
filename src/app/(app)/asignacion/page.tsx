import type { Metadata } from "next";

import { PortProblem } from "@/design-system/components";
import { requirePermission } from "@/authz/server";
import { DropList } from "@/features/asignacion/drop-list";
import { Planner } from "@/features/asignacion/planner";
import { cap } from "@/features/shared/format";
import { hhmm, longDate } from "@/lib/clock";
import { withFault } from "@/lib/fault";
import { academic } from "@/modules/academic";
import { enrollment } from "@/modules/enrollment";
import { requireActor } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Asignar y botar cursos" };

const fmt = (iso: string) => `${longDate(new Date(iso))} a las ${hhmm(new Date(iso))}`;

/** Next term's preferences and dropping a current course, on one page, with no pop-ups. */
export default async function AsignacionPage() {
  await requirePermission("set_enrollment_preferences");
  const actor = await requireActor();
  const [w, offer, prefs, courses, dropped] = await Promise.all([
    withFault("enrollment", () => enrollment().getWindow(actor)),
    withFault("enrollment", () => enrollment().listOffer(actor)),
    withFault("enrollment", () => enrollment().getPreferences(actor)),
    academic().listCurrentEnrollments(actor),
    enrollment().listDropped(actor),
  ]);
  if (!w.ok)
    return (
      <div className="py-16">
        <PortProblem error={w.error} what="la asignación" />
      </div>
    );
  const estado = {
    proxima: `Abre el ${fmt(w.value.abre)}`,
    abierta: `Ventana abierta hasta el ${fmt(w.value.cierra)}`,
    cerrada: `Ventana cerrada · resolución el ${fmt(w.value.resolucion)}`,
    resuelta: "Resultado publicado",
  }[w.value.estado];
  return (
    <div className="pb-10">
      <section className="reveal pt-10 pb-8 md:pt-14 md:pb-10">
        <p className="text-[15px] text-fg-muted">{cap(estado)}</p>
        <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium md:text-[64px]">
          Asignación {w.value.periodo}
        </h1>
      </section>
      {!offer.ok || !prefs.ok ? (
        <PortProblem
          error={!offer.ok ? offer.error : !prefs.ok ? prefs.error : "unavailable"}
          what="tu oferta"
        />
      ) : (
        <Planner
          window={w.value}
          offer={offer.value}
          saved={prefs.value.preferencias}
          guardadas={prefs.value.guardadas}
          formatDate={{
            cierra: fmt(w.value.cierra),
            resolucion: fmt(w.value.resolucion),
            guardadas: prefs.value.guardadas ? fmt(prefs.value.guardadas) : "",
          }}
        />
      )}
      <section aria-labelledby="botar-t" className="pt-14">
        <h2 id="botar-t" className="display text-[28px] font-medium md:text-[34px]">
          Botar un curso de este semestre
        </h2>
        <p className="mt-1 pb-4 text-[15px] text-fg-muted">
          Se confirma con un código; no hay ventanas emergentes.
        </p>
        {courses.ok ? (
          <DropList
            courses={courses.value.map((c) => ({
              id: c.id,
              nombre: c.nombre,
              slot: c.slot,
              seccion: c.seccion,
              creditos: c.creditos,
            }))}
            dropped={dropped.ok ? dropped.value : []}
          />
        ) : (
          <PortProblem error={courses.error} what="tus cursos" />
        )}
      </section>
    </div>
  );
}
