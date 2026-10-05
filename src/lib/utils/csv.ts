/** One CSV cell: quoted when needed, and neutralised against spreadsheet formula injection. */
export function csvCell(val: unknown): string {
  let s = val == null ? "" : String(val);
  if (typeof val === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function csvRow(values: unknown[]): string {
  return values.map(csvCell).join(",");
}
