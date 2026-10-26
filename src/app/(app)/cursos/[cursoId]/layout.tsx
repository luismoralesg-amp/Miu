import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";

import { PortProblem, RouteTabs, type RouteTab } from "@/design-system/components";
import { requirePermission } from "@/authz/server";
import { scheduleLabel } from "@/features/cursos/table";
import { loadCourse } from "@/features/curso/load";
import { route } from "@/features/shared/format";
import { subsectionLabel, subsections } from "@/modules/academic";

type Props = { children: ReactNode; params: Promise<{ cursoId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { course } = await loadCourse((await params).cursoId);
  return { title: course.ok ? course.value.nombre : "Curso" };
}

/** Course frame: color hairline, schedule, name, and every subsection as its own URL. */
export default async function CourseLayout({ children, params }: Props) {
  await requirePermission("view_course");
  const { cursoId } = await params;
  const { course } = await loadCourse(cursoId);
  if (!course.ok) return <PortProblem error={course.error} what="este curso" className="py-24" />;
  const c = course.value;
  const base = `/cursos/${c.id}`;
  const tabs: RouteTab[] = [
    { href: route(base), label: "Resumen", exact: true },
    ...subsections.map((s) => ({
      href: route(`${base}/${s}`),
      label: subsectionLabel[s],
      muted: c.deshabilitadas.includes(s),
    })),
  ];
  return (
    <div className="pb-10">
      <section className="reveal pt-10 pb-6 md:pt-14" style={{ "--i": 0 } as CSSProperties}>
        <span aria-hidden="true" className={`block h-1 w-16 rounded-full bg-course-${c.slot}`} />
        <p className="mt-5 text-[15px] text-fg-muted">
          Sección {c.seccion} · {scheduleLabel(c.horario)} · {c.horario.salon}
        </p>
        <h1 className="mt-2 display text-[40px] leading-[1.02] font-medium text-balance md:text-[64px]">
          {c.nombre}
        </h1>
      </section>
      <RouteTabs tabs={tabs} label={`Secciones de ${c.corto}`} exact={false} className="mb-10" />
      {children}
    </div>
  );
}
