import type { CSSProperties } from "react";

import { BrandMark, Card } from "@/design-system/components";

import { Section } from "./_section";
import { MotionDemo } from "./_demos";

const colorGroups: Array<{ name: string; tokens: Array<{ token: string; role: string }> }> = [
  {
    name: "Superficies y bordes",
    tokens: [
      { token: "bg", role: "Fondo de la app" },
      { token: "surface", role: "Tarjetas" },
      { token: "surface-subtle", role: "Rellenos suaves" },
      { token: "border", role: "Divisores" },
      { token: "border-control", role: "Borde de campos (3:1)" },
    ],
  },
  {
    name: "Texto",
    tokens: [
      { token: "fg", role: "Texto principal" },
      { token: "fg-muted", role: "Etiquetas y apoyo" },
    ],
  },
  {
    name: "Acento UFM",
    tokens: [
      { token: "brand-red", role: "Rojo del escudo" },
      { token: "accent-to", role: "Fin del degradado" },
      { token: "accent-fg", role: "Texto y enlaces de acento" },
      { token: "accent-soft", role: "Fondo de acento suave" },
    ],
  },
  {
    name: "Semánticos",
    tokens: [
      { token: "info-fg", role: "Información y foco" },
      { token: "success-fg", role: "Éxito" },
      { token: "warning-fg", role: "Advertencia" },
      { token: "danger-fg", role: "Error (rosa, no el rojo UFM)" },
    ],
  },
];

const typeScale = [
  { className: "text-display", name: "display · 64", sample: "87.4" },
  { className: "text-metric", name: "metric · 48", sample: "Q7,387.80" },
  { className: "text-title-1", name: "title-1 · 32", sample: "Buenos días, Ana" },
  { className: "text-title-2", name: "title-2 · 24", sample: "Pendientes de esta semana" },
  { className: "text-title-3", name: "title-3 · 20", sample: "Paradigmas de Programación" },
  {
    className: "text-body",
    name: "body · 16",
    sample: "Entrega el ejercicio de llaves antes del viernes.",
  },
  { className: "text-label", name: "label · 14", sample: "Vence mañana a las 23:59" },
  { className: "text-caption", name: "caption · 12", sample: "Actualizado hace 2 min" },
];

export default function FoundationsPage() {
  return (
    <>
      <Section
        title="Color"
        description="Neutros fríos con un solo acento: el rojo del escudo UFM, en degradado y con moderación. Todos los pares de texto cumplen WCAG AA en claro y oscuro (lo verifica tokens.test.ts)."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {colorGroups.map((group) => (
            <Card key={group.name} title={group.name} titleLevel={3}>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {group.tokens.map(({ token, role }) => (
                  <li key={token} className="flex flex-col gap-1.5">
                    <span
                      className="h-12 rounded-md border border-border"
                      style={{ background: `var(--${token})` } as CSSProperties}
                    />
                    <code className="text-caption font-medium text-fg">{token}</code>
                    <span className="text-caption text-fg-muted">{role}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
        <div className="flex h-16 items-center rounded-lg bg-linear-to-b from-accent-from to-accent-to px-6 text-body font-medium text-on-accent">
          Degradado de acento · #E22726 → #C21D1D · texto blanco ≥ 4.6:1
        </div>
      </Section>

      <Section
        title="Tipografía"
        description="Inter variable, autoalojada. El tracking se cierra y el interlineado se compacta a medida que el texto crece; los números usan cifras tabulares."
      >
        <Card padding="flush">
          <ul className="divide-y divide-border">
            {typeScale.map((step) => (
              <li
                key={step.name}
                className="grid gap-1 px-6 py-4 md:grid-cols-[10rem_1fr] md:items-baseline"
              >
                <code className="text-caption text-fg-muted">{step.name}</code>
                <span
                  className={`${step.className} ${step.className.startsWith("text-title") || ["text-display", "text-metric"].includes(step.className) ? "font-semibold" : ""} text-fg tabular`}
                >
                  {step.sample}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section
        title="Forma y elevación"
        description="Radios de 8, 12 y 16 px. Las tarjetas usan 24 px de padding y 12 px de separación. En claro flotan con una sombra suave; en oscuro la sombra se cambia por un borde de 1 px."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["rounded-sm", "sm · 8 px", "Chips y controles pequeños"],
            ["rounded-md", "md · 12 px", "Botones y campos"],
            ["rounded-lg", "lg · 16 px", "Tarjetas y diálogos"],
          ].map(([radius, name, use]) => (
            <div
              key={name}
              className={`${radius} flex h-28 flex-col justify-end gap-0.5 border border-border bg-surface p-4`}
            >
              <code className="text-label font-medium text-fg">{name}</code>
              <span className="text-caption text-fg-muted">{use}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Movimiento"
        description="El contenido que reemplaza a un skeleton entra con fade y 8 px hacia arriba, escalonado cada 40 ms (360 ms, ease-out fuerte). Presionar escala a 0.97 en 140 ms. El cambio de tema es instantáneo y con reduced motion solo queda el fade."
      >
        <MotionDemo />
      </Section>

      <Section
        title="Marca"
        description="Archivos oficiales sin redibujar. En el encabezado: escudo + MiU. En el inicio de sesión: identidad completa (logo oficial en oscuro; escudo y nombre en Inter en claro)."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Card titleLevel={3} title="Compacta" description="Encabezado de la app">
            <BrandMark />
          </Card>
          <Card titleLevel={3} title="Completa" description="Inicio de sesión y pie de página">
            <BrandMark variant="lockup" />
          </Card>
        </div>
      </Section>
    </>
  );
}
