import { CircleCheck, Clock, Info, TriangleAlert } from "lucide-react";

import {
  Avatar,
  Badge,
  Card,
  Kbd,
  MaskedValue,
  ProgressRing,
  Sparkline,
} from "@/design-system/components";

import { ButtonsDemo, ChoicesDemo, DialogDemo, FieldsDemo } from "../_demos";
import { Section } from "../_section";

export const metadata = { title: "Componentes · Sistema de diseño" };

export default function ComponentsPage() {
  return (
    <>
      <Section
        title="Botones"
        description="Un solo botón primario por vista. La respuesta al presionar es inmediata (escala 0.97); el hover solo existe con puntero fino. Los botones de solo ícono siempre llevan nombre accesible."
      >
        <Card>
          <ButtonsDemo />
        </Card>
      </Section>

      <Section
        title="Campos"
        description="Etiqueta siempre visible, ayuda debajo y error en línea mientras escribes, nunca solo al enviar. 16 px para que iOS no haga zoom."
      >
        <Card>
          <FieldsDemo />
        </Card>
      </Section>

      <Section
        title="Opciones"
        description="Radios y casillas nativos (flechas y espacio funcionan solos); el interruptor aplica el cambio al instante."
      >
        <Card>
          <ChoicesDemo />
        </Card>
      </Section>

      <Section title="Insignias, avatares y atajos">
        <Card>
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              <Badge>Borrador</Badge>
              <Badge tone="accent">Vence mañana</Badge>
              <Badge tone="info" icon={<Info aria-hidden="true" />}>
                Nuevo documento
              </Badge>
              <Badge tone="success" icon={<CircleCheck aria-hidden="true" />}>
                Solvente
              </Badge>
              <Badge tone="warning" icon={<Clock aria-hidden="true" />}>
                En revisión
              </Badge>
              <Badge tone="danger" icon={<TriangleAlert aria-hidden="true" />}>
                Entrega atrasada
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Avatar name="Ana López" size="sm" />
              <Avatar name="Carlos Méndez" />
              <Avatar name="María José Ruiz" size="lg" />
              <span className="text-label text-fg-muted">
                Buscar en todo MiU <Kbd>⌘</Kbd> <Kbd>K</Kbd>
              </span>
            </div>
          </div>
        </Card>
      </Section>

      <Section
        title="Datos personales enmascarados"
        description="El CUI y la fecha de nacimiento se muestran ocultos por defecto y se vuelven a ocultar a los 30 s. Más adelante, mostrar pedirá una verificación extra (passkey o código)."
      >
        <Card>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <dt className="text-label text-fg-muted">CUI (dato ficticio)</dt>
              <dd>
                <MaskedValue label="CUI" value="1234 56789 0101" />
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-label text-fg-muted">Fecha de nacimiento (dato ficticio)</dt>
              <dd>
                <MaskedValue label="fecha de nacimiento" value="14/03/2006" visible={0} />
              </dd>
            </div>
          </dl>
        </Card>
      </Section>

      <Section title="Progreso y tendencia">
        <Card>
          <div className="flex flex-wrap items-center gap-8">
            <div className="flex items-center gap-4">
              <ProgressRing value={112} max={189} label="UMA aprobadas">
                59%
              </ProgressRing>
              <div className="flex flex-col">
                <span className="text-body font-medium text-fg">112 de 189 UMA</span>
                <span className="text-label text-fg-muted">Ciencias de la Computación</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-accent-fg">
              <Sparkline
                points={[78, 81, 80, 84, 83, 86, 87.4]}
                summary="Promedio de 78 a 87.4 en siete períodos, en alza."
              />
              <span className="text-label text-fg-muted">Promedio por período</span>
            </div>
          </div>
        </Card>
      </Section>

      <Section
        title="Diálogo"
        description="Solo se abre por una acción del usuario. Escape, el botón cerrar o tocar fuera lo cierran; el foco vuelve al botón que lo abrió."
      >
        <Card>
          <div>
            <DialogDemo />
          </div>
        </Card>
      </Section>
    </>
  );
}
