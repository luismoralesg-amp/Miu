/** "2847 51963 0101" → "•••• ••••• 0101": only the last group stays visible. */
export function maskCui(cui: string) {
  const groups = cui.trim().split(/\s+/);
  return groups.map((g, i) => (i === groups.length - 1 ? g : "•".repeat(g.length))).join(" ");
}

/** "2005-03-14" → "••/••/2005": the year alone is not enough to identify anyone. */
export function maskBirth(iso: string) {
  return `••/••/${iso.slice(0, 4)}`;
}

/** "5555-0187" → "••••-0187" */
export function maskPhone(phone: string) {
  return phone.replace(/\d(?=.*\d{4}$)/g, "•");
}
