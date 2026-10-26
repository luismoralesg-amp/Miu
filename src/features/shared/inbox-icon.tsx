import {
  BadgeCheck,
  FileText,
  ListChecks,
  Megaphone,
  MessageSquareWarning,
  NotebookPen,
  PencilLine,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { InboxItem } from "@/modules/inbox";

/** One icon per kind of inbox item, used by Hoy, the Bandeja and the bell alike. */
const ICONS: Record<InboxItem["icono"], LucideIcon> = {
  entrega: NotebookPen,
  examen: PencilLine,
  nota: BadgeCheck,
  documento: FileText,
  anuncio: Megaphone,
  pago: Wallet,
  calificar: ListChecks,
  apelacion: MessageSquareWarning,
};

export function InboxIcon({ kind, className }: { kind: InboxItem["icono"]; className?: string }) {
  const Icon = ICONS[kind];
  return <Icon aria-hidden="true" className={className} />;
}
