/**
 * iCalendar (RFC 5545) for activities, exams and the weekly schedule. Times are written in UTC, lines
 * end in CRLF and are folded at 75 octets, and text is escaped, so every calendar app reads it.
 */
export type IcsEvent = {
  uid: string;
  start: Date;
  end?: Date;
  titulo: string;
  lugar?: string;
  descripcion?: string;
  /** Weekly repetition until a date (classes): BYDAY uses MO, TU, WE, TH, FR, SA, SU. */
  semanal?: { dias: number[]; hasta: Date };
  /** Minutes before to remind, if any. */
  aviso?: number;
};

const BYDAY = ["", "MO", "TU", "WE", "TH", "FR", "SA", "SU"];

export function icsDate(d: Date) {
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

export function escapeText(s: string) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/([,;])/g, "\\$1");
}

/** Folds a content line at 75 octets (UTF-8), continuing with a space. */
export function fold(line: string) {
  const bytes = new TextEncoder();
  const out: string[] = [];
  let current = "";
  for (const ch of line) {
    const limit = out.length === 0 ? 75 : 74;
    if (bytes.encode(current + ch).length > limit) {
      out.push(current);
      current = ch;
    } else current += ch;
  }
  out.push(current);
  return out.join("\r\n ");
}

export function buildIcs(events: IcsEvent[], { nombre = "MiU", stamp = new Date() } = {}) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UFM//MiU Nuevo//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(nombre)}`,
  ];
  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}@miu.ufm.edu`,
      `DTSTAMP:${icsDate(stamp)}`,
      `DTSTART:${icsDate(e.start)}`,
      `DTEND:${icsDate(e.end ?? new Date(e.start.getTime() + 30 * 60_000))}`,
      `SUMMARY:${escapeText(e.titulo)}`,
    );
    if (e.lugar) lines.push(`LOCATION:${escapeText(e.lugar)}`);
    if (e.descripcion) lines.push(`DESCRIPTION:${escapeText(e.descripcion)}`);
    if (e.semanal)
      lines.push(
        `RRULE:FREQ=WEEKLY;BYDAY=${e.semanal.dias.map((d) => BYDAY[d]).join(",")};UNTIL=${icsDate(e.semanal.hasta)}`,
      );
    if (e.aviso !== undefined)
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeText(e.titulo)}`,
        `TRIGGER:-PT${e.aviso}M`,
        "END:VALARM",
      );
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(fold).join("\r\n")}\r\n`;
}
