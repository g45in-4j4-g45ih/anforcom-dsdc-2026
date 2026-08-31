// Auto-compact formatting per the stat-tile figure contract: 1,284 / 12.9K / 4.2M
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}
