import { RouteTabs } from "@/design-system/components";
import { route } from "@/features/shared/format";

/** The four sides of the Administrativo's money work, each a real URL. */
export function PagosTabs() {
  return (
    <RouteTabs
      label="Pagos"
      className="mb-8"
      tabs={[
        { href: route("/admin/pagos"), label: "Comprobantes" },
        { href: route("/admin/pagos/caja"), label: "Caja" },
        { href: route("/admin/pagos/conciliacion"), label: "Conciliación" },
        { href: route("/admin/pagos/reembolsos"), label: "Reembolsos" },
      ]}
    />
  );
}
