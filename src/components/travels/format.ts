/**
 * Travel-specific date helpers. Trips store dates as ISO `date` strings
 * (YYYY-MM-DD) which `new Date()` parses as UTC midnight — fine for display.
 */

function parse(d: string | null | undefined): Date | null {
  if (!d) return null
  const t = new Date(d)
  return Number.isNaN(t.getTime()) ? null : t
}

const MONTH_DAY: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
const MONTH_DAY_YEAR: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
}

/**
 * "12 – 18 Mar 2025" style range. Collapses same-month / same-day and shows
 * a single date when only one bound is present. Returns "" when neither is.
 */
export function formatDateRange(
  startIso: string | null | undefined,
  endIso: string | null | undefined
): string {
  const start = parse(startIso)
  const end = parse(endIso)

  if (!start && !end) return ""
  if (start && !end)
    return start.toLocaleDateString("en-US", MONTH_DAY_YEAR)
  if (!start && end) return end.toLocaleDateString("en-US", MONTH_DAY_YEAR)

  // both present
  const s = start as Date
  const e = end as Date
  const sameYear = s.getFullYear() === e.getFullYear()
  const sameMonth = sameYear && s.getMonth() === e.getMonth()
  const sameDay = sameMonth && s.getDate() === e.getDate()

  if (sameDay) return e.toLocaleDateString("en-US", MONTH_DAY_YEAR)

  if (sameMonth) {
    // "12 – 18 Mar 2025"
    const month = e.toLocaleDateString("en-US", { month: "short" })
    return `${s.getDate()} – ${e.getDate()} ${month} ${e.getFullYear()}`
  }

  const left = s.toLocaleDateString("en-US", sameYear ? MONTH_DAY : MONTH_DAY_YEAR)
  const right = e.toLocaleDateString("en-US", MONTH_DAY_YEAR)
  return `${left} – ${right}`
}
