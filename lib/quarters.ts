/**
 * Quarter derivation: Jan–Mar = Q1, Apr–Jun = Q2, Jul–Sep = Q3, Oct–Dec = Q4.
 * Format: "Q1 2025", "Q3 2025". Current unfinished quarter gets " (Unfinished)".
 */

export function getQuarterFromDate(date: Date): { year: number; quarter: 1 | 2 | 3 | 4 } {
  const month = date.getMonth(); // 0-11
  const year = date.getFullYear();
  const quarter = (Math.floor(month / 3) + 1) as 1 | 2 | 3 | 4;
  return { year, quarter };
}

export function getQuarterKey(year: number, quarter: 1 | 2 | 3 | 4): string {
  return `${year}-Q${quarter}`;
}

function isQuarterEnded(year: number, quarter: 1 | 2 | 3 | 4, now: Date): boolean {
  const endMonth = quarter * 3 - 1; // 2, 5, 8, 11
  const endDay = [31, 30, 30, 31][quarter - 1];
  const quarterEnd = new Date(year, endMonth, endDay, 23, 59, 59);
  return now > quarterEnd;
}

/**
 * Returns label like "Q1 2025" or "Q1 2026 (Unfinished)" when the quarter hasn't ended yet.
 */
export function getQuarterLabel(
  year: number,
  quarter: 1 | 2 | 3 | 4,
  options?: { now?: Date }
): string {
  const now = options?.now ?? new Date();
  const unfinished = !isQuarterEnded(year, quarter, now);
  const label = `Q${quarter} ${year}`;
  return unfinished ? `${label} (Unfinished)` : label;
}

export function getQuarterLabelFromDate(date: Date, options?: { now?: Date }): string {
  const { year, quarter } = getQuarterFromDate(date);
  return getQuarterLabel(year, quarter, options);
}

export function getQuarterKeyFromDate(date: Date): string {
  const { year, quarter } = getQuarterFromDate(date);
  return getQuarterKey(year, quarter);
}
