import { describe, expect, it } from "vitest";

import { buildIcs, escapeText, fold, icsDate } from "./ics";

describe("ICS generator", () => {
  const stamp = new Date("2026-10-22T13:42:00Z");

  it("writes UTC times and escapes text", () => {
    expect(icsDate(new Date("2026-10-23T13:00:00Z"))).toBe("20261023T130000Z");
    expect(escapeText("Hayek; cap. 3, notas\nfinal")).toBe(
      String.raw`Hayek\; cap. 3\, notas\nfinal`,
    );
  });

  it("folds lines at 75 octets, counting UTF-8 bytes", () => {
    const line = `SUMMARY:${"á".repeat(60)}`;
    const folded = fold(line).split("\r\n ");
    expect(folded.length).toBeGreaterThan(1);
    for (const part of folded)
      expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
    expect(folded.join("")).toBe(line);
  });

  it("builds a valid calendar with CRLF, an alarm and a weekly rule", () => {
    const ics = buildIcs(
      [
        {
          uid: "md-parcial-2",
          start: new Date("2026-10-23T13:00:00Z"),
          end: new Date("2026-10-23T14:20:00Z"),
          titulo: "Parcial 2 · Matemática Discreta",
          lugar: "D-307",
          aviso: 60,
        },
        {
          uid: "clase-md",
          start: new Date("2026-10-26T13:00:00Z"),
          titulo: "Matemática Discreta",
          semanal: { dias: [1, 3, 4], hasta: new Date("2026-12-06T05:59:59Z") },
        },
      ],
      { stamp },
    );
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).not.toMatch(/[^\r]\n/);
    expect(ics).toContain("UID:md-parcial-2@miu.ufm.edu");
    expect(ics).toContain("DTSTART:20261023T130000Z\r\nDTEND:20261023T142000Z");
    expect(ics).toContain("TRIGGER:-PT60M");
    expect(ics).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO,WE,TH;UNTIL=20261206T055959Z");
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
  });
});
