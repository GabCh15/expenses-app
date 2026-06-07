/**
 * Timezone-aware date helpers.
 *
 * Uses Intl.DateTimeFormat with "sv-SE" locale (YYYY-MM-DD) so dates are
 * computed in the specified timezone regardless of where the server runs.
 */

export function today(timezone: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
