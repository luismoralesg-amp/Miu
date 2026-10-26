import type { Subsection } from "@/modules/academic";

/** Empty-state copy per subsection, written for each one (Spanish agreement differs per noun). */
export const EMPTY_COPY: Record<Subsection, { title: string; description: string }> = {
  actividades: {
    title: "Aún no hay actividades",
    description: "Cuando el curso publique tareas o exámenes, aparecen aquí con su fecha.",
  },
  notas: {
    title: "Aún no hay notas publicadas",
    description: "Las notas aparecen aquí en cuanto se publican; también te llega un aviso.",
  },
  documentos: {
    title: "Aún no hay documentos",
    description: "Guías, diapositivas y enunciados aparecen aquí cuando se suben.",
  },
  anuncios: {
    title: "Aún no hay anuncios",
    description: "Los anuncios del curso aparecen aquí y en tu Bandeja.",
  },
  personas: {
    title: "Aún no hay personas asignadas",
    description: "El catedrático y los auxiliares aparecen aquí cuando se asignan.",
  },
  programa: {
    title: "El programa aún no está publicado",
    description: "Cuando el catedrático lo suba, verás objetivos, temas y evaluación.",
  },
  bibliografia: {
    title: "Aún no hay bibliografía",
    description: "Los libros y lecturas del curso aparecen aquí.",
  },
  foro: {
    title: "Aún no hay conversaciones",
    description: "Cuando alguien abra un tema en el foro, aparece aquí.",
  },
  blog: {
    title: "Aún no hay entradas",
    description: "Las entradas del blog del curso aparecen aquí.",
  },
  examenes: {
    title: "Aún no hay exámenes programados",
    description: "Cuando se programen, verás fecha, salón, peso y temas.",
  },
  enlaces: {
    title: "Aún no hay enlaces",
    description: "Los sitios recomendados para el curso aparecen aquí.",
  },
  biblioteca: {
    title: "Aún no hay recursos de biblioteca",
    description: "Libros electrónicos y préstamos del curso aparecen aquí.",
  },
  "recursos-ia": {
    title: "Aún no hay recursos de IA",
    description: "Las herramientas de IA que el curso autorice aparecen aquí.",
  },
  "actividad-reciente": {
    title: "Sin actividad en los últimos 14 días",
    description: "Notas, documentos y anuncios recientes aparecen aquí.",
  },
};
