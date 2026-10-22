import { ArrowRight, CalendarClock, CircleCheck, MapPin } from "lucide-react";

import {
  Avatar,
  Badge,
  BentoGrid,
  BentoItem,
  Card,
  ProgressRing,
  Reveal,
  Sparkline,
  Stat,
  buttonClasses,
} from "@/design-system/components";
import { cx } from "@/lib/cx";

import { Section } from "../_section";

export const metadata = { title: "Ejemplo: Hoy · Sistema de diseño" };

const pending = [
  {
    title: "Ejercicio de llaves",
    course: "Paradigmas de Programación",
    due: "Mañana, 23:59",
    tone: "accent" as const,
  },
  {
    title: "Quiz 4: grafos",
    course: "Matemática Discreta",
    due: "Viernes",
    tone: "neutral" as const,
  },
  {
    title: "Lectura: Hayek, cap. 3",
    course: "Ética de la Libertad",
    due: "Lunes",
    tone: "neutral" as const,
  },
  {
    title: "Proyecto: parser JSON",
    course: "Paradigmas de Programación",
    due: "En 9 días",
    tone: "neutral" as const,
  },
];

const classes = [
  { time: "07:00–08:20", course: "Matemática Discreta (A)", room: "D-307", status: "Ahora" },
  { time: "09:00–10:20", course: "Paradigmas de Programación (A)", room: "D-210", status: null },
  {
    time: "14:00–15:20",
    course: "Ética de la Libertad (C)",
    room: "Auditorio Juan Bautista",
    status: null,
  },
];

/**
 * Preview of the "Hoy" screen with fictitious data, to judge the bento layout and the accent in
 * context. The real screen arrives in E4 with data from the read models.
 * Mapping from the reference: big balance → average; activity table → pending; featured card →
 * the next important thing; messages → teachers and assistants.
 */
export default function TodayPreviewPage() {
  return (
    <Section
      title="Ejemplo: Hoy"
      description="Vista previa con datos ficticios para evaluar la cuadrícula bento y el acento en contexto. La pantalla real llega en E4."
    >
      <div className="flex flex-col gap-1">
        <p className="text-label text-fg-muted">Miércoles 22 de octubre</p>
        <p className="text-title-1 font-semibold text-fg">Buenos días, Ana</p>
      </div>

      <BentoGrid>
        <BentoItem>
          <Reveal index={0} className="flex">
            <article className="flex flex-1 flex-col justify-between gap-6 rounded-lg bg-linear-to-br from-accent-from to-accent-to p-6 text-on-accent">
              <div className="flex flex-col gap-3">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-sm bg-black/20 px-2 py-1 text-caption font-medium">
                  <CalendarClock aria-hidden="true" className="size-3.5" />
                  Lo próximo importante
                </span>
                <h3 className="text-title-1 font-semibold">Parcial 2 de Matemática Discreta</h3>
                <p className="flex items-center gap-1.5 text-body">
                  <MapPin aria-hidden="true" className="size-4" />
                  Mañana, 07:00 · D-307
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-label">
                  Temas: grafos, árboles y recurrencias. Vale 20% de la nota.
                </p>
                <a href="#" className={buttonClasses({ variant: "on-accent", className: "w-fit" })}>
                  Ver temario
                  <ArrowRight aria-hidden="true" />
                </a>
              </div>
            </article>
          </Reveal>
        </BentoItem>

        <BentoItem>
          <Reveal index={1} className="flex">
            <Card as="article" className="flex-1 justify-between gap-4">
              <Stat
                label="Promedio del período"
                value="87.4"
                size="display"
                delta={{
                  value: "+1.2",
                  direction: "up",
                  tone: "success",
                  label: "Sube respecto al período anterior",
                }}
                footnote="vs. período anterior"
              />
              <span className="text-accent-fg">
                <Sparkline
                  width={200}
                  points={[78, 81, 80, 84, 83, 86, 87.4]}
                  summary="Promedio de 78 a 87.4 en siete períodos."
                />
              </span>
            </Card>
          </Reveal>
        </BentoItem>

        <BentoItem>
          <Reveal index={2} className="flex">
            <Card as="article" className="flex-1 justify-between gap-4">
              <Stat
                label="Créditos aprobados"
                value="112"
                unit="de 189 UMA"
                footnote="Te faltan 77 UMA"
              />
              <div className="flex items-center gap-3">
                <ProgressRing value={112} max={189} label="UMA aprobadas" size={56}>
                  59%
                </ProgressRing>
                <span className="text-label text-fg-muted">
                  Semestre 5 de 8 · Ciencias de la Computación
                </span>
              </div>
            </Card>
          </Reveal>
        </BentoItem>

        <BentoItem span="two-thirds">
          <Reveal index={3} className="flex">
            <Card
              as="article"
              titleLevel={3}
              title="Pendientes"
              description="4 por entregar esta semana y la próxima"
              padding="flush"
              className="flex-1"
              action={
                <a href="#" className={buttonClasses({ size: "sm", variant: "ghost" })}>
                  Ver bandeja
                </a>
              }
            >
              <ul className="divide-y divide-border border-t border-border">
                {pending.map((item) => (
                  <li key={item.title}>
                    <a
                      href="#"
                      className="flex items-center justify-between gap-4 px-6 py-3.5 hover:bg-surface-subtle"
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-body font-medium text-fg">{item.title}</span>
                        <span className="truncate text-label text-fg-muted">{item.course}</span>
                      </span>
                      <Badge tone={item.tone}>{item.due}</Badge>
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        </BentoItem>

        <BentoItem>
          <Reveal index={4} className="flex">
            <Card as="article" className="flex-1 gap-4">
              <Stat
                label="Saldo de este mes"
                value="Q7,387.80"
                footnote="Vence el 5 de noviembre"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge tone="success" icon={<CircleCheck aria-hidden="true" />}>
                  Solvente
                </Badge>
                <a href="#" className={buttonClasses({ size: "sm" })}>
                  Pagar sin comisión
                </a>
              </div>
            </Card>
          </Reveal>
        </BentoItem>

        <BentoItem span="two-thirds">
          <Reveal index={5} className="flex">
            <Card as="article" titleLevel={3} title="Clases de hoy" className="flex-1">
              <ol className="flex flex-col gap-2">
                {classes.map((item) => (
                  <li
                    key={item.course}
                    className={cx(
                      "grid grid-cols-[6.5rem_1fr] items-center gap-4 rounded-md p-3",
                      item.status ? "bg-accent-soft" : "bg-surface-subtle",
                    )}
                  >
                    <span
                      className={cx(
                        "text-label font-medium tabular",
                        item.status ? "text-accent-soft-fg" : "text-fg-muted",
                      )}
                    >
                      {item.time}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-2 text-body font-medium text-fg">
                        <span className="truncate">{item.course}</span>
                        {item.status && <Badge tone="accent">{item.status}</Badge>}
                      </span>
                      <span className="text-label text-fg-muted">{item.room}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </Card>
          </Reveal>
        </BentoItem>

        <BentoItem>
          <Reveal index={6} className="flex">
            <Card as="article" titleLevel={3} title="Mensajes" className="flex-1">
              <ul className="flex flex-col gap-4">
                {[
                  [
                    "Carlos Méndez",
                    "Auxiliar · Paradigmas",
                    "Ya publiqué las notas de la actividad 5.",
                  ],
                  ["Lucía Herrera", "Catedrática · Ética", "Recuerden traer la lectura impresa."],
                ].map(([name, role, text]) => (
                  <li key={name} className="flex gap-3">
                    <Avatar name={name!} size="sm" />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-label font-medium text-fg">
                        {name} <span className="font-normal text-fg-muted">· {role}</span>
                      </span>
                      <span className="truncate text-label text-fg-muted">{text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        </BentoItem>
      </BentoGrid>
    </Section>
  );
}
