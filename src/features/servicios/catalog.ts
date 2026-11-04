/**
 * Services MiU links to. Requirements and steps are written as examples until each office confirms
 * them [S]; nothing here is official UFM policy.
 */
export type Service = {
  slug: string;
  titulo: string;
  grupo: "Trámites" | "Campus" | "Idiomas";
  resumen: string;
  pasos: string[];
  estado?: string;
  externo?: { label: string; url: string };
  interno?: { label: string; href: string };
};

export const SERVICES: Service[] = [
  {
    slug: "documentos",
    titulo: "Solicitud de documentos",
    grupo: "Trámites",
    resumen: "Constancias, certificaciones y cartas.",
    pasos: [
      "Elige el tipo de documento.",
      "Recibe el aviso cuando esté listo.",
      "Descárgalo con su código de verificación.",
    ],
    interno: { label: "Ir a Documentos", href: "/documentos" },
  },
  {
    slug: "graduaciones",
    titulo: "Graduaciones",
    grupo: "Trámites",
    resumen: "Requisitos y trámites de graduación.",
    pasos: [
      "Revisa tu avance en el Pensum.",
      "Completa el requisito de inglés y el de conferencias.",
      "Solicita la revisión de expediente en Registro.",
    ],
    estado: "Te faltan 20 cursos del pensum de ejemplo.",
    interno: { label: "Ver mi pensum", href: "/pensum" },
  },
  {
    slug: "suficiencia",
    titulo: "Examen por suficiencia",
    grupo: "Trámites",
    resumen: "Aprobar un curso con un examen.",
    pasos: [
      "Consulta qué cursos lo permiten.",
      "Solicítalo en Registro dentro de la ventana.",
      "Paga el arancel y presenta el examen.",
    ],
    estado: "Próxima ventana: enero de 2027 (fecha de ejemplo).",
  },
  {
    slug: "parqueo",
    titulo: "Parqueo",
    grupo: "Campus",
    resumen: "Activación del marbete de parqueo.",
    pasos: [
      "Registra la placa de tu vehículo.",
      "Paga el marbete del semestre.",
      "Recógelo en Seguridad con tu carné.",
    ],
    estado: "Marbete activo hasta el 15 de diciembre (ejemplo).",
  },
  {
    slug: "impresiones",
    titulo: "Impresiones de laboratorio",
    grupo: "Campus",
    resumen: "Saldo y envío de impresiones.",
    pasos: [
      "Recarga saldo en caja o en línea.",
      "Envía tu archivo desde cualquier laboratorio.",
      "Libera la impresión con tu carné.",
    ],
    estado: "Saldo disponible: Q35.00 (ejemplo).",
  },
  {
    slug: "duolingo",
    titulo: "Duolingo English Test",
    grupo: "Idiomas",
    resumen: "Requisito de inglés.",
    pasos: [
      "Presenta el examen en línea.",
      "Comparte el resultado con la UFM desde Duolingo.",
      "Registro lo valida en una semana.",
    ],
    externo: { label: "Abrir Duolingo English Test", url: "https://englishtest.duolingo.com" },
  },
];
