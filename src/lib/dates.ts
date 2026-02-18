/**
 * Get the Monday of the current week as YYYY-MM-DD string.
 * Uses local timezone (not UTC) to avoid date shifts.
 */
export function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return formatLocalDate(monday);
}

/**
 * Get the Monday of next week as YYYY-MM-DD string.
 * Used by the cron scheduler (runs Sunday, plans for next week).
 */
export function getNextMonday(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysUntilMonday);
  return formatLocalDate(monday);
}

/**
 * Format a Date as YYYY-MM-DD using local timezone.
 * Avoids the UTC shift issue with toISOString().
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
