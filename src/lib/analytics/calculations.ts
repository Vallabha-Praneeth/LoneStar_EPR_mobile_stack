/** Pure calculation functions — no DB, no side effects. */

export function workedHours(startedAt: string | null, endedAt: string | null): number {
  if (!startedAt || !endedAt)
    return 0;
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  if (ms <= 0 || !Number.isFinite(ms))
    return 0;
  return ms / 3_600_000;
}

export function grossProfit(revenue: number, driverCost: number, internalCost: number): number {
  return revenue - driverCost - internalCost;
}

export function marginPct(revenue: number, profit: number): number {
  if (revenue <= 0)
    return 0;
  return profit / revenue;
}

export function num(value: number | null | undefined): number {
  return value ?? 0;
}
