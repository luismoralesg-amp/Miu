import { Lock, Megaphone } from "lucide-react";

import { Card, EmptyState } from "@/design-system/components";

import { ErrorDemo, LoadingDemo, TimeoutDemo } from "../_demos";
import { Section } from "../_section";

export const metadata = { title: "Estados · Sistema de diseño" };

export default function StatesPage() {
  return (
    <>
      <Section
        title="Cargando"
        description="Cada carga muestra un skeleton con la forma del contenido y se anuncia una sola vez a lectores de pantalla. El contenido entra escalonado."
      >
        <LoadingDemo />
      </Section>

      <Section
        title="Vacío"
        description="Explica por qué no hay nada y qué hacer. Distingue «todavía no hay» de «el catedrático no lo habilitó», algo que MiU mostraba igual o en blanco."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Card titleLevel={3} title="Anuncios">
            <EmptyState
              icon={<Megaphone aria-hidden="true" />}
              title="Todavía no hay anuncios"
              description="Cuando tu catedrático publique uno, te avisaremos en la bandeja."
            />
          </Card>
          <Card titleLevel={3} title="Foro">
            <EmptyState
              reason="disabled"
              icon={<Lock aria-hidden="true" />}
              title="El foro no está habilitado en este curso"
              description="Tu catedrático decide si lo usa. Para dudas, escribe desde Mensajes."
            />
          </Card>
        </div>
      </Section>

      <Section
        title="Error y tiempo agotado"
        description="Ninguna pantalla se queda colgada: tras 10 s sin respuesta se ofrece reintentar, y un error dice qué pasó y qué hacer."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <ErrorDemo />
          </Card>
          <Card>
            <TimeoutDemo />
          </Card>
        </div>
      </Section>
    </>
  );
}
