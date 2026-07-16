/** Parse NZ short money strings like 870K, $1.2M, TBC → cents or null. */
export function parseNzMoneyToCents(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const t = raw.trim().replace(/,/g, "").toUpperCase();
  if (!t || t === "TBC" || t === "POA" || t === "N/A") return null;
  const m = t.match(/^\$?([\d.]+)\s*(K|M)?$/);
  if (!m) return null;
  const n = Number.parseFloat(m[1]!);
  if (!Number.isFinite(n)) return null;
  const mult = m[2] === "M" ? 1_000_000 : m[2] === "K" ? 1_000 : 1;
  return Math.round(n * mult * 100);
}

export function parseJsonNumber(raw: string | undefined): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
